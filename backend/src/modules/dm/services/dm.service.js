const conversationRepository = require("../repositories/conversation.repository");
const directMessageRepository = require("../repositories/directMessage.repository");
const socketManager = require("../../../sockets/socket.manager");
const NotFoundError = require("../../../shared/errors/NotFoundError");
const ForbiddenError = require("../../../shared/errors/ForbiddenError");

/*
|--------------------------------------------------------------------------
| DmService
|--------------------------------------------------------------------------
*/
class DmService {
  /*
  |----------------------------------------------------------
  | Conversations
  |----------------------------------------------------------
  */

  /**
   * Get or create a conversation between two users.
   * Prevents self-messaging.
   */
  async getOrCreateConversation(userId, targetUserId) {
    if (userId.toString() === targetUserId.toString()) {
      throw new ForbiddenError("You cannot start a conversation with yourself");
    }
    return conversationRepository.findOrCreate(userId, targetUserId);
  }

  /**
   * Get the inbox (all conversations) for the requesting user.
   */
  async getInbox(userId) {
    const conversations = await conversationRepository.findByUser(userId);
    const totalUnread = await conversationRepository.getTotalUnread(userId);
    return { conversations, totalUnread };
  }

  /**
   * Mark all messages in a conversation as read + reset unread counter.
   */
  async markConversationRead(conversationId, userId) {
    // Verify user is a participant
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation not found");

    const isParticipant = conversation.participants.some(
      (p) => (p._id || p).toString() === userId.toString()
    );
    if (!isParticipant) throw new ForbiddenError("Access denied");

    await directMessageRepository.markRead(conversationId, userId);
    await conversationRepository.resetUnread(conversationId, userId);
    return { success: true };
  }

  /*
  |----------------------------------------------------------
  | Messages
  |----------------------------------------------------------
  */

  /**
   * Get paginated messages for a conversation.
   */
  async getMessages(conversationId, userId, cursor, limit) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation not found");

    const isParticipant = conversation.participants.some(
      (p) => (p._id || p).toString() === userId.toString()
    );
    if (!isParticipant) throw new ForbiddenError("Access denied");

    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const messages = await directMessageRepository.findByConversation(
      conversationId,
      cursor || null,
      parsedLimit
    );

    return { messages, conversation };
  }

  /**
   * Send a DM — persist, update conversation, emit to both users.
   */
  async sendMessage(senderId, conversationId, content) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation not found");

    const isParticipant = conversation.participants.some(
      (p) => (p._id || p).toString() === senderId.toString()
    );
    if (!isParticipant) throw new ForbiddenError("Access denied");

    // Identify the recipient (other participant)
    const recipient = conversation.participants.find(
      (p) => (p._id || p).toString() !== senderId.toString()
    );
    const recipientId = recipient?._id || recipient;

    const message = await directMessageRepository.create({
      conversationId,
      senderId,
      content,
    });

    // Update denormalized lastMessage + increment recipient's unread
    await conversationRepository.updateLastMessage(conversationId, message, recipientId);

    // Emit to both participants' personal rooms
    const payload = { message, conversationId };
    socketManager.toUser(senderId.toString(), "dm:message", payload);
    if (recipientId) {
      socketManager.toUser(recipientId.toString(), "dm:message", payload);
    }

    return message;
  }

  /**
   * Edit a DM — sender only.
   */
  async editMessage(userId, messageId, content) {
    const existing = await directMessageRepository.findById(messageId);
    if (!existing) throw new NotFoundError("Message not found");
    if (existing.isDeleted) throw new NotFoundError("Message has been deleted");

    const senderId = (existing.senderId?._id || existing.senderId).toString();
    if (senderId !== userId.toString()) {
      throw new ForbiddenError("You can only edit your own messages");
    }

    const updated = await directMessageRepository.updateContent(messageId, content);

    // Get conversation to find both participants
    const conversation = await conversationRepository.findById(existing.conversationId);
    const payload = { messageId, content, editedAt: updated.editedAt, conversationId: existing.conversationId };

    conversation?.participants.forEach((p) => {
      socketManager.toUser((p._id || p).toString(), "dm:message:edited", payload);
    });

    return updated;
  }

  /**
   * Soft-delete a DM — sender only.
   */
  async deleteMessage(userId, messageId) {
    const existing = await directMessageRepository.findById(messageId);
    if (!existing) throw new NotFoundError("Message not found");
    if (existing.isDeleted) throw new NotFoundError("Already deleted");

    const senderId = (existing.senderId?._id || existing.senderId).toString();
    if (senderId !== userId.toString()) {
      throw new ForbiddenError("You can only delete your own messages");
    }

    const deleted = await directMessageRepository.softDelete(messageId);

    const conversation = await conversationRepository.findById(existing.conversationId);
    const payload = { messageId, conversationId: existing.conversationId };
    conversation?.participants.forEach((p) => {
      socketManager.toUser((p._id || p).toString(), "dm:message:deleted", payload);
    });

    return deleted;
  }
}

module.exports = new DmService();
