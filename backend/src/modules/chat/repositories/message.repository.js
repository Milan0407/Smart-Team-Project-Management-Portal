const Message = require("../models/message.model");

/*
|--------------------------------------------------------------------------
| MessageRepository
| Implements cursor-based pagination for efficient real-time chat history
|--------------------------------------------------------------------------
*/
class MessageRepository {
  /**
   * Fetch paginated messages for a project channel.
   * Cursor-based: use the createdAt of the oldest message already loaded
   * to fetch the next batch of older messages.
   *
   * @param {string}  projectId
   * @param {string|null} cursor  - ISO timestamp; fetch messages BEFORE this
   * @param {number}  limit
   */
  async findByProject(projectId, cursor = null, limit = 50) {
    const query = { projectId, isDeleted: false };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .populate("senderId", "name email avatar")
      .populate({
        path: "replyTo",
        select: "content senderId createdAt isDeleted",
        populate: { path: "senderId", select: "name" },
      })
      .sort({ createdAt: -1 })
      .limit(limit);

    // Return in chronological order (oldest → newest) for the UI
    return messages.reverse();
  }

  async create(data) {
    const message = await Message.create(data);
    return Message.findById(message._id)
      .populate("senderId", "name email avatar")
      .populate({
        path: "replyTo",
        select: "content senderId createdAt isDeleted",
        populate: { path: "senderId", select: "name" },
      });
  }

  async findById(id) {
    return Message.findById(id)
      .populate("senderId", "name email avatar");
  }

  /**
   * Update content and mark editedAt
   */
  async updateContent(id, content) {
    return Message.findByIdAndUpdate(
      id,
      { $set: { content, editedAt: new Date() } },
      { new: true }
    ).populate("senderId", "name email avatar");
  }

  /**
   * Soft-delete: retain the document but flag isDeleted
   */
  async softDelete(id) {
    return Message.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true }
    );
  }

  /**
   * Count total non-deleted messages in a project (for stats)
   */
  async countByProject(projectId) {
    return Message.countDocuments({ projectId, isDeleted: false });
  }
}

module.exports = new MessageRepository();
