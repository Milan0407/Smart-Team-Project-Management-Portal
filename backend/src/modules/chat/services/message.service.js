const messageRepository = require("../repositories/message.repository");
const projectRepository = require("../../project/repositories/project.repository");
const socketManager = require("../../../sockets/socket.manager");
const NotFoundError = require("../../../shared/errors/NotFoundError");
const ForbiddenError = require("../../../shared/errors/ForbiddenError");

/*
|--------------------------------------------------------------------------
| MessageService
|--------------------------------------------------------------------------
*/
class MessageService {
  /**
   * Fetch paginated message history for a project channel.
   */
  async getMessages(projectId, cursor, limit) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError("Project not found");

    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);

    const messages = await messageRepository.findByProject(
      projectId,
      cursor || null,
      parsedLimit
    );

    // Determine if more messages exist (for infinite scroll "load more")
    let hasMore = false;
    if (messages.length === parsedLimit) {
      const oldest = messages[0];
      const olderCount = await messageRepository.findByProject(
        projectId,
        oldest.createdAt.toISOString(),
        1
      );
      hasMore = olderCount.length > 0;
    }

    return { messages, hasMore };
  }

  /**
   * Persist a new message, broadcast via socket.
   */
  async sendMessage(senderId, projectId, data) {
    const message = await messageRepository.create({
      projectId,
      senderId,
      content: data.content,
      type: data.type || "text",
      replyTo: data.replyTo || null,
    });

    // Broadcast to all users in the project room
    socketManager.toProject(projectId.toString(), "chat:message", {
      message,
      projectId,
    });

    return message;
  }

  /**
   * Edit a message — only the sender may edit their own messages.
   */
  async editMessage(userId, messageId, content) {
    const existing = await messageRepository.findById(messageId);
    if (!existing) throw new NotFoundError("Message not found");
    if (existing.isDeleted) throw new NotFoundError("Message has been deleted");

    const senderId = existing.senderId._id
      ? existing.senderId._id.toString()
      : existing.senderId.toString();

    if (senderId !== userId.toString()) {
      throw new ForbiddenError("You can only edit your own messages");
    }

    const updated = await messageRepository.updateContent(messageId, content);

    // Broadcast edit event
    socketManager.toProject(existing.projectId.toString(), "chat:message:edited", {
      messageId,
      content,
      editedAt: updated.editedAt,
      projectId: existing.projectId,
    });

    return updated;
  }

  /**
   * Soft-delete a message — sender or project_manager may delete.
   */
  async deleteMessage(userId, messageId, projectRole) {
    const existing = await messageRepository.findById(messageId);
    if (!existing) throw new NotFoundError("Message not found");
    if (existing.isDeleted) throw new NotFoundError("Message already deleted");

    const senderId = existing.senderId._id
      ? existing.senderId._id.toString()
      : existing.senderId.toString();

    const isOwner = senderId === userId.toString();
    const isManager = projectRole === "project_manager";

    if (!isOwner && !isManager) {
      throw new ForbiddenError("You are not allowed to delete this message");
    }

    const deleted = await messageRepository.softDelete(messageId);

    // Broadcast delete event so clients hide the message
    socketManager.toProject(existing.projectId.toString(), "chat:message:deleted", {
      messageId,
      projectId: existing.projectId,
    });

    return deleted;
  }
}

module.exports = new MessageService();
