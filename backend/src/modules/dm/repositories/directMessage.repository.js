const DirectMessage = require("../models/directMessage.model");

/*
|--------------------------------------------------------------------------
| DirectMessageRepository
|--------------------------------------------------------------------------
*/
class DirectMessageRepository {
  /**
   * Cursor-based pagination — newest first, reversed to chronological.
   * @param {string}      conversationId
   * @param {string|null} cursor  - ISO date; fetch messages BEFORE this timestamp
   * @param {number}      limit
   */
  async findByConversation(conversationId, cursor = null, limit = 50) {
    const query = { conversationId, isDeleted: false };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await DirectMessage.find(query)
      .populate("senderId", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(limit);

    return messages.reverse(); // chronological order for UI
  }

  async create(data) {
    const msg = await DirectMessage.create(data);
    return DirectMessage.findById(msg._id)
      .populate("senderId", "name email avatar");
  }

  async findById(id) {
    return DirectMessage.findById(id)
      .populate("senderId", "name email avatar");
  }

  async updateContent(id, content) {
    return DirectMessage.findByIdAndUpdate(
      id,
      { $set: { content, editedAt: new Date() } },
      { new: true }
    ).populate("senderId", "name email avatar");
  }

  async softDelete(id) {
    return DirectMessage.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true }
    );
  }

  /**
   * Mark messages as read (set readAt) for recipient in a conversation.
   */
  async markRead(conversationId, recipientId) {
    return DirectMessage.updateMany(
      {
        conversationId,
        senderId: { $ne: recipientId }, // only messages from other user
        readAt: null,
        isDeleted: false,
      },
      { $set: { readAt: new Date() } }
    );
  }
}

module.exports = new DirectMessageRepository();
