const dmService = require("../services/dm.service");
const ApiResponse = require("../../../shared/utils/ApiResponse");

/*
|--------------------------------------------------------------------------
| DmController
|--------------------------------------------------------------------------
*/
class DmController {
  // ── Inbox ──────────────────────────────────────────────────────────────

  async getInbox(req, res) {
    const result = await dmService.getInbox(req.user.id);
    return res.json(new ApiResponse({ message: "Inbox fetched", data: result }));
  }

  // ── Conversations ──────────────────────────────────────────────────────

  async getOrCreateConversation(req, res) {
    const { targetUserId } = req.body;
    const conversation = await dmService.getOrCreateConversation(req.user.id, targetUserId);
    return res.status(201).json(
      new ApiResponse({ message: "Conversation ready", data: conversation })
    );
  }

  async markRead(req, res) {
    const result = await dmService.markConversationRead(req.params.id, req.user.id);
    return res.json(new ApiResponse({ message: "Conversation marked as read", data: result }));
  }

  // ── Messages ───────────────────────────────────────────────────────────

  async getMessages(req, res) {
    const { id } = req.params;
    const { cursor, limit } = req.query;
    const result = await dmService.getMessages(id, req.user.id, cursor, limit);
    return res.json(new ApiResponse({ message: "Messages fetched", data: result }));
  }

  async sendMessage(req, res) {
    const { id } = req.params;
    const message = await dmService.sendMessage(req.user.id, id, req.body.content);
    return res.status(201).json(
      new ApiResponse({ message: "Message sent", data: message })
    );
  }

  async editMessage(req, res) {
    const { msgId } = req.params;
    const updated = await dmService.editMessage(req.user.id, msgId, req.body.content);
    return res.json(new ApiResponse({ message: "Message updated", data: updated }));
  }

  async deleteMessage(req, res) {
    const { msgId } = req.params;
    const deleted = await dmService.deleteMessage(req.user.id, msgId);
    return res.json(new ApiResponse({ message: "Message deleted", data: deleted }));
  }
}

module.exports = new DmController();
