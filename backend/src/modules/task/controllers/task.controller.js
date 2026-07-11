const taskService = require("../services/task.service");
const ApiResponse = require("../../../shared/utils/ApiResponse");

class TaskController {
  /*
  |--------------------------------------------------------------------------
  | Task CRUD
  |--------------------------------------------------------------------------
  */

  async createTask(req, res) {
    const task = await taskService.createTask(
      req.params.projectId,
      req.body,
      req.user.id
    );

    return res.status(201).json(
      new ApiResponse({
        message: "Task created successfully",
        data: task,
      })
    );
  }

  async getTask(req, res) {
    // Task pre-loaded by checkTaskAccess middleware
    return res.json(
      new ApiResponse({
        message: "Task fetched successfully",
        data: req.task,
      })
    );
  }

  async getTasksByProject(req, res) {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      assigneeId: req.query.assigneeId,
      boardId: req.query.boardId,
    };

    // Remove undefined keys
    Object.keys(filters).forEach(
      (k) => filters[k] === undefined && delete filters[k]
    );

    const tasks = await taskService.getTasksByProject(
      req.params.projectId,
      filters
    );

    return res.json(
      new ApiResponse({
        message: "Tasks fetched successfully",
        data: tasks,
      })
    );
  }

  async getTasksByBoard(req, res) {
    const tasks = await taskService.getTasksByBoard(
      req.params.boardId,
      req.query.column || null
    );

    return res.json(
      new ApiResponse({
        message: "Board tasks fetched successfully",
        data: tasks,
      })
    );
  }

  async updateTask(req, res) {
    const task = await taskService.updateTask(
      req.params.id,
      req.body,
      req.user.id
    );

    return res.json(
      new ApiResponse({
        message: "Task updated successfully",
        data: task,
      })
    );
  }

  async moveTask(req, res) {
    const { columnName, order } = req.body;
    const task = await taskService.moveTask(
      req.params.id,
      columnName,
      order ?? 0,
      req.user.id
    );

    return res.json(
      new ApiResponse({
        message: "Task moved successfully",
        data: task,
      })
    );
  }

  async deleteTask(req, res) {
    await taskService.deleteTask(req.params.id, req.user.id);

    return res.json(
      new ApiResponse({
        message: "Task deleted successfully",
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Comments
  |--------------------------------------------------------------------------
  */

  async addComment(req, res) {
    const task = await taskService.addComment(
      req.params.id,
      req.body.content,
      req.user.id
    );

    return res.status(201).json(
      new ApiResponse({
        message: "Comment added successfully",
        data: task,
      })
    );
  }

  async removeComment(req, res) {
    const task = await taskService.removeComment(
      req.params.taskId,
      req.params.commentId,
      req.user.id,
      req.projectRole || "developer"
    );

    return res.json(
      new ApiResponse({
        message: "Comment deleted successfully",
        data: task,
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Activity
  |--------------------------------------------------------------------------
  */

  async getTaskActivity(req, res) {
    const activities = await taskService.getTaskActivity(req.params.id);

    return res.json(
      new ApiResponse({
        message: "Task activity fetched successfully",
        data: activities,
      })
    );
  }

  async addAttachment(req, res) {
    if (!req.file) {
      return res.status(400).json(
        new ApiResponse({
          success: false,
          message: "No file uploaded",
        })
      );
    }

    const task = await taskService.addAttachment(
      req.params.id,
      req.file,
      req.user.id
    );

    return res.status(201).json(
      new ApiResponse({
        message: "Attachment added successfully",
        data: task,
      })
    );
  }

  async removeAttachment(req, res) {
    const task = await taskService.removeAttachment(
      req.params.taskId,
      req.params.attachmentId,
      req.user.id
    );

    return res.json(
      new ApiResponse({
        message: "Attachment removed successfully",
        data: task,
      })
    );
  }

  async exportTasksToCSV(req, res) {
    const csvData = await taskService.exportTasksToCSV(req.params.projectId);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=project-${req.params.projectId}-tasks.csv`);
    return res.status(200).send(csvData);
  }
}

module.exports = new TaskController();
