const Task = require("../models/task.model");

/*
|--------------------------------------------------------------------------
| Shared populate config
|--------------------------------------------------------------------------
*/
const POPULATE_FIELDS = [
  { path: "assigneeId", select: "name email avatar" },
  { path: "reporterId", select: "name email avatar" },
  { path: "comments.authorId", select: "name avatar" },
  { path: "attachments.uploadedBy", select: "name avatar" },
];

class TaskRepository {
  async create(data) {
    const task = await Task.create(data);
    return task.populate(POPULATE_FIELDS);
  }

  async findById(id) {
    return Task.findById(id).populate(POPULATE_FIELDS);
  }

  async findByProjectId(projectId, filters = {}) {
    const query = { projectId, isActive: true };

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.assigneeId) query.assigneeId = filters.assigneeId;
    if (filters.boardId) query.boardId = filters.boardId;

    return Task.find(query)
      .populate(POPULATE_FIELDS)
      .sort({ order: 1, createdAt: -1 });
  }

  async findByBoardId(boardId, columnName = null) {
    const query = { boardId, isActive: true };
    if (columnName) query.columnName = columnName;

    return Task.find(query)
      .populate(POPULATE_FIELDS)
      .sort({ columnName: 1, order: 1, createdAt: 1 });
  }

  /**
   * Count tasks in a column for order calculation
   */
  async countByColumn(boardId, columnName) {
    return Task.countDocuments({ boardId, columnName, isActive: true });
  }

  async findColumnTasks(boardId, columnName, excludeTaskId = null) {
    const query = {
      boardId,
      columnName,
      isActive: true,
    };

    if (excludeTaskId) {
      query._id = { $ne: excludeTaskId };
    }

    return Task.find(query)
      .select("_id columnName order createdAt")
      .sort({ order: 1, createdAt: 1 });
  }

  async bulkUpdatePositions(positions, updatedBy) {
    if (positions.length === 0) {
      return null;
    }

    return Task.bulkWrite(
      positions.map(({ taskId, columnName, order, status }) => ({
        updateOne: {
          filter: { _id: taskId },
          update: {
            $set: {
              columnName,
              order,
              ...(status ? { status } : {}),
              updatedBy,
            },
          },
        },
      }))
    );
  }

  async updateById(id, updateData, options = {}) {
    return Task.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true, ...options }
    ).populate(POPULATE_FIELDS);
  }

  async moveTask(id, columnName, order, updatedBy, status = null) {
    return Task.findByIdAndUpdate(
      id,
      { $set: { columnName, order, updatedBy, ...(status ? { status } : {}) } },
      { new: true }
    ).populate(POPULATE_FIELDS);
  }

  async deactivate(id, updatedBy) {
    return Task.findByIdAndUpdate(
      id,
      { $set: { isActive: false, updatedBy } },
      { new: true }
    );
  }

  async addComment(taskId, comment) {
    return Task.findByIdAndUpdate(
      taskId,
      { $push: { comments: comment } },
      { new: true }
    ).populate(POPULATE_FIELDS);
  }

  async removeComment(taskId, commentId) {
    return Task.findByIdAndUpdate(
      taskId,
      { $pull: { comments: { _id: commentId } } },
      { new: true }
    ).populate(POPULATE_FIELDS);
  }

  async addAttachment(taskId, attachment) {
    return Task.findByIdAndUpdate(
      taskId,
      { $push: { attachments: attachment } },
      { new: true }
    ).populate(POPULATE_FIELDS);
  }

  async removeAttachment(taskId, attachmentId) {
    return Task.findByIdAndUpdate(
      taskId,
      { $pull: { attachments: { _id: attachmentId } } },
      { new: true }
    ).populate(POPULATE_FIELDS);
  }
}

module.exports = new TaskRepository();
