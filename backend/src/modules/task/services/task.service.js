const fs = require("fs");
const path = require("path");
const taskRepository = require("../repositories/task.repository");
const projectRepository = require("../../project/repositories/project.repository");
const boardRepository = require("../../board/repositories/board.repository");
const activityService = require("../../activity/services/activity.service");
const notificationService = require("../../notification/services/notification.service");
const socketManager = require("../../../sockets/socket.manager");
const NotFoundError = require("../../../shared/errors/NotFoundError");
const ForbiddenError = require("../../../shared/errors/ForbiddenError");

const STATUS_BY_COLUMN = {
  todo: "todo",
  "to do": "todo",
  backlog: "todo",
  "in progress": "in_progress",
  progress: "in_progress",
  doing: "in_progress",
  "in review": "in_review",
  review: "in_review",
  done: "done",
  completed: "done",
  complete: "done",
  cancelled: "cancelled",
  canceled: "cancelled",
};

const getStatusForColumn = (columnName) => {
  if (!columnName) return null;
  return STATUS_BY_COLUMN[columnName.trim().toLowerCase()] || null;
};

class TaskService {
  /*
  |--------------------------------------------------------------------------
  | Task CRUD
  |--------------------------------------------------------------------------
  */

  async createTask(projectId, data, currentUserId) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    // Validate boardId + columnName if provided
    if (data.boardId) {
      const board = await boardRepository.findById(data.boardId);
      if (!board || board.projectId.toString() !== projectId.toString()) {
        throw new NotFoundError("Board not found in this project");
      }
    }

    // Calculate order: place at end of the column
    let order = 0;
    if (data.boardId && data.columnName) {
      order = await taskRepository.countByColumn(data.boardId, data.columnName);
    }

    const task = await taskRepository.create({
      projectId,
      boardId: data.boardId || null,
      columnName: data.columnName || null,
      title: data.title,
      description: data.description || "",
      assigneeId: data.assigneeId || null,
      reporterId: currentUserId,
      priority: data.priority || "medium",
      status: data.status || getStatusForColumn(data.columnName) || "todo",
      dueDate: data.dueDate || null,
      order,
      createdBy: currentUserId,
      updatedBy: currentUserId,
    });

    // Log activity (fire-and-forget — don't block response)
    activityService
      .logActivity(task._id, projectId, currentUserId, "created", {
        title: task.title,
      })
      .catch(() => {});

    // Broadcast task creation to socket clients
    if (task.boardId) {
      socketManager.toProject(projectId, "board:updated", {
        projectId,
        boardId: task.boardId,
        action: "task:created",
        taskId: task._id,
      });
    }

    return task;
  }

  async getTaskById(id) {
    const task = await taskRepository.findById(id);
    if (!task || !task.isActive) {
      throw new NotFoundError("Task not found");
    }
    return task;
  }

  async getTasksByProject(projectId, filters = {}) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    return taskRepository.findByProjectId(projectId, filters);
  }

  async getTasksByBoard(boardId, columnName = null) {
    const board = await boardRepository.findById(boardId);
    if (!board) {
      throw new NotFoundError("Board not found");
    }
    return taskRepository.findByBoardId(boardId, columnName);
  }

  async updateTask(id, updateData, currentUserId) {
    const task = await taskRepository.findById(id);
    if (!task || !task.isActive) {
      throw new NotFoundError("Task not found");
    }

    // Collect changed fields for activity log
    const changes = {};
    const trackFields = ["title", "description", "assigneeId", "priority", "status", "dueDate"];
    for (const field of trackFields) {
      if (updateData[field] !== undefined) {
        const oldVal = task[field] ? task[field].toString() : null;
        const newVal = updateData[field] ? updateData[field].toString() : null;
        if (oldVal !== newVal) {
          changes[field] = { from: oldVal, to: newVal };
        }
      }
    }

    if (changes.dueDate) {
      updateData.reminderSent = false;
    }

    const updated = await taskRepository.updateById(id, {
      ...updateData,
      updatedBy: currentUserId,
    });

    if (Object.keys(changes).length > 0) {
      activityService
        .logActivity(id, task.projectId, currentUserId, "updated", { changes })
        .catch(() => {});

      // Broadcast update to sockets
      if (task.boardId) {
        socketManager.toProject(task.projectId.toString(), "board:updated", {
          projectId: task.projectId,
          boardId: task.boardId,
          action: "task:updated",
          taskId: id,
        });
      }

      // Trigger assignment notification
      if (changes.assigneeId && updateData.assigneeId && updateData.assigneeId.toString() !== currentUserId.toString()) {
        (async () => {
          try {
            const project = await projectRepository.findById(task.projectId);
            const link = `/orgs/${project.orgId}/projects/${task.projectId}/boards/${task.boardId}`;
            await notificationService.createNotification({
              userId: updateData.assigneeId,
              actorId: currentUserId,
              title: "Task Assigned",
              content: `You have been assigned the task: "${task.title}"`,
              type: "assignment",
              link,
              metadata: { taskId: id },
            });
          } catch (err) {
            // Suppress errors to not fail main request
          }
        })();
      }
    }

    return updated;
  }

  async moveTask(id, columnName, order, currentUserId) {
    const task = await taskRepository.findById(id);
    if (!task || !task.isActive) {
      throw new NotFoundError("Task not found");
    }

    if (!task.boardId) {
      throw new NotFoundError("Task is not assigned to a board");
    }

    const board = await boardRepository.findById(task.boardId);
    if (!board) {
      throw new NotFoundError("Board not found");
    }

    const targetColumnExists = board.columns.some(
      (column) => column.name === columnName
    );

    if (!targetColumnExists) {
      throw new NotFoundError("Column not found on this board");
    }

    const prevColumn = task.columnName;
    const targetOrder = Math.max(0, Number(order) || 0);

    const sourceTasks = await taskRepository.findColumnTasks(
      task.boardId,
      prevColumn,
      id
    );

    const destinationTasks =
      prevColumn === columnName
        ? sourceTasks
        : await taskRepository.findColumnTasks(
            task.boardId,
            columnName,
            id
          );

    const clampedOrder = Math.min(
      targetOrder,
      destinationTasks.length
    );
    const reorderedDestination = [...destinationTasks];
    reorderedDestination.splice(clampedOrder, 0, {
      _id: task._id,
    });

    const positions = [];
    const mappedStatus = getStatusForColumn(columnName) || task.status;

    if (prevColumn !== columnName) {
      sourceTasks.forEach((item, index) => {
        positions.push({
          taskId: item._id,
          columnName: prevColumn,
          order: index,
        });
      });
    }

    reorderedDestination.forEach((item, index) => {
      positions.push({
        taskId: item._id,
        columnName,
        order: index,
        ...(item._id.toString() === id.toString()
          ? { status: mappedStatus }
          : {}),
      });
    });

    await taskRepository.bulkUpdatePositions(
      positions,
      currentUserId
    );

    const updated = await taskRepository.findById(id);

    activityService
      .logActivity(id, task.projectId, currentUserId, "moved", {
        from: prevColumn,
        to: columnName,
      })
      .catch(() => {});

    // Broadcast move to sockets
    if (task.boardId) {
      socketManager.toProject(task.projectId.toString(), "board:updated", {
        projectId: task.projectId,
        boardId: task.boardId,
        action: "task:moved",
        taskId: id,
        columnName,
        order,
      });
    }

    return updated;
  }

  async deleteTask(id, currentUserId) {
    const task = await taskRepository.findById(id);
    if (!task || !task.isActive) {
      throw new NotFoundError("Task not found");
    }

    await taskRepository.deactivate(id, currentUserId);

    activityService
      .logActivity(id, task.projectId, currentUserId, "deleted", {
        title: task.title,
      })
      .catch(() => {});

    // Broadcast deletion to sockets
    if (task.boardId) {
      socketManager.toProject(task.projectId.toString(), "board:updated", {
        projectId: task.projectId,
        boardId: task.boardId,
        action: "task:deleted",
        taskId: id,
      });
    }

    return { success: true };
  }

  /*
  |--------------------------------------------------------------------------
  | Comments
  |--------------------------------------------------------------------------
  */

  async addComment(taskId, content, currentUserId) {
    const task = await taskRepository.findById(taskId);
    if (!task || !task.isActive) {
      throw new NotFoundError("Task not found");
    }

    const updated = await taskRepository.addComment(taskId, {
      authorId: currentUserId,
      content,
      createdAt: new Date(),
    });

    activityService
      .logActivity(taskId, task.projectId, currentUserId, "commented", {
        preview: content.substring(0, 80),
      })
      .catch(() => {});

    // Broadcast update to sockets
    if (task.boardId) {
      socketManager.toProject(task.projectId.toString(), "board:updated", {
        projectId: task.projectId,
        boardId: task.boardId,
        action: "task:updated",
        taskId,
      });
    }

    // Send notifications to assignee & reporter
    (async () => {
      try {
        const project = await projectRepository.findById(task.projectId);
        const link = `/orgs/${project.orgId}/projects/${task.projectId}/boards/${task.boardId}`;
        const commentAuthorName = updated.comments[updated.comments.length - 1].authorId.name || "A user";

        const notificationPayloads = [];

        // Notify Assignee
        if (task.assigneeId && task.assigneeId._id.toString() !== currentUserId.toString()) {
          notificationPayloads.push({
            userId: task.assigneeId._id,
            actorId: currentUserId,
            title: "New Comment on Task",
            content: `${commentAuthorName} commented on "${task.title}": "${content.substring(0, 60)}..."`,
            type: "comment",
            link,
            metadata: { taskId, commentId: updated.comments[updated.comments.length - 1]._id },
          });
        }

        // Notify Reporter (if not assignee and not author)
        if (
          task.reporterId &&
          task.reporterId._id.toString() !== currentUserId.toString() &&
          (!task.assigneeId || task.reporterId._id.toString() !== task.assigneeId._id.toString())
        ) {
          notificationPayloads.push({
            userId: task.reporterId._id,
            actorId: currentUserId,
            title: "New Comment on Task",
            content: `${commentAuthorName} commented on "${task.title}": "${content.substring(0, 60)}..."`,
            type: "comment",
            link,
            metadata: { taskId, commentId: updated.comments[updated.comments.length - 1]._id },
          });
        }

        for (const payload of notificationPayloads) {
          await notificationService.createNotification(payload);
        }
      } catch (err) {
        // Suppress errors to not fail main request
      }
    })();

    return updated;
  }

  async removeComment(taskId, commentId, currentUserId, currentUserRole) {
    const task = await taskRepository.findById(taskId);
    if (!task || !task.isActive) {
      throw new NotFoundError("Task not found");
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      throw new NotFoundError("Comment not found");
    }

    // Only comment author or project manager can delete
    const isAuthor = comment.authorId._id
      ? comment.authorId._id.toString() === currentUserId.toString()
      : comment.authorId.toString() === currentUserId.toString();

    if (!isAuthor && currentUserRole !== "project_manager") {
      throw new ForbiddenError("You cannot delete this comment");
    }

    const updated = await taskRepository.removeComment(taskId, commentId);

    activityService
      .logActivity(taskId, task.projectId, currentUserId, "comment_deleted", {})
      .catch(() => {});

    return updated;
  }

  /*
  |--------------------------------------------------------------------------
  | Activity
  |--------------------------------------------------------------------------
  */

  async getTaskActivity(taskId) {
    const task = await taskRepository.findById(taskId);
    if (!task || !task.isActive) {
      throw new NotFoundError("Task not found");
    }
    return activityService.getActivitiesByTask(taskId);
  }

  async addAttachment(taskId, file, currentUserId) {
    const task = await taskRepository.findById(taskId);
    if (!task || !task.isActive) {
      throw new NotFoundError("Task not found");
    }

    const attachment = {
      name: file.originalname,
      path: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: currentUserId,
      createdAt: new Date(),
    };

    const updatedTask = await taskRepository.addAttachment(taskId, attachment);

    activityService
      .logActivity(taskId, task.projectId, currentUserId, "updated", {
        attachment: file.originalname,
      })
      .catch(() => {});

    // Broadcast board update to sockets
    if (task.boardId) {
      socketManager.toProject(task.projectId.toString(), "board:updated", {
        projectId: task.projectId,
        boardId: task.boardId,
        action: "task:updated",
        taskId,
      });
    }

    return updatedTask;
  }

  async removeAttachment(taskId, attachmentId, currentUserId) {
    const task = await taskRepository.findById(taskId);
    if (!task || !task.isActive) {
      throw new NotFoundError("Task not found");
    }

    const attachment = task.attachments.id(attachmentId);
    if (!attachment) {
      throw new NotFoundError("Attachment not found");
    }

    // Try deleting physical file from disk
    const filename = path.basename(attachment.path);
    const filepath = path.join(__dirname, "../../../uploads", filename);
    fs.unlink(filepath, (err) => {
      if (err) console.error(`Failed to delete physical file: ${filepath}`, err.message);
    });

    const updatedTask = await taskRepository.removeAttachment(taskId, attachmentId);

    activityService
      .logActivity(taskId, task.projectId, currentUserId, "updated", {
        removedAttachment: attachment.name,
      })
      .catch(() => {});

    // Broadcast board update to sockets
    if (task.boardId) {
      socketManager.toProject(task.projectId.toString(), "board:updated", {
        projectId: task.projectId,
        boardId: task.boardId,
        action: "task:updated",
        taskId,
      });
    }

    return updatedTask;
  }

  async exportTasksToCSV(projectId) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const tasks = await taskRepository.findByProjectId(projectId);

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return "";
      let str = val.toString().replace(/"/g, '""');
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        str = `"${str}"`;
      }
      return str;
    };

    const csvHeaders = ["Title", "Status", "Priority", "Assignee", "Reporter", "Due Date", "Created At", "Description"].join(",");
    const csvRows = tasks.map((task) => {
      const assignee = task.assigneeId ? `${task.assigneeId.name} (${task.assigneeId.email})` : "Unassigned";
      const reporter = task.reporterId ? `${task.reporterId.name} (${task.reporterId.email})` : "Unknown";
      const dueDate = task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "";
      const createdAt = new Date(task.createdAt).toISOString();
      return [
        escapeCSV(task.title),
        escapeCSV(task.status),
        escapeCSV(task.priority),
        escapeCSV(assignee),
        escapeCSV(reporter),
        escapeCSV(dueDate),
        escapeCSV(createdAt),
        escapeCSV(task.description || ""),
      ].join(",");
    });

    return [csvHeaders, ...csvRows].join("\n");
  }
}

module.exports = new TaskService();
