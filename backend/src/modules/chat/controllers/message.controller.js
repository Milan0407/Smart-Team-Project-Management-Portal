const messageService = require("../services/message.service");
const ApiResponse = require("../../../shared/utils/ApiResponse");

/*
|--------------------------------------------------------------------------
| MessageController — thin HTTP layer, delegates to MessageService
|--------------------------------------------------------------------------
*/
class MessageController {
  /**
   * GET /api/v1/projects/:projectId/messages
   * Query params: cursor (ISO date), limit (default 50)
   */
  async getMessages(req, res) {
    const { projectId } = req.params;
    const { cursor, limit } = req.query;

    const result = await messageService.getMessages(projectId, cursor, limit);

    return res.json(
      new ApiResponse({
        message: "Messages fetched successfully",
        data: result,
      })
    );
  }

  /**
   * POST /api/v1/projects/:projectId/messages
   */
  async sendMessage(req, res) {
    const { projectId } = req.params;
    const message = await messageService.sendMessage(req.user.id, projectId, req.body);

    return res.status(201).json(
      new ApiResponse({
        message: "Message sent",
        data: message,
      })
    );
  }

  /**
   * PATCH /api/v1/projects/:projectId/messages/:id
   */
  async editMessage(req, res) {
    const { id } = req.params;
    const updated = await messageService.editMessage(req.user.id, id, req.body.content);

    return res.json(
      new ApiResponse({
        message: "Message updated",
        data: updated,
      })
    );
  }

  /**
   * DELETE /api/v1/projects/:projectId/messages/:id
   */
  async deleteMessage(req, res) {
    const { id } = req.params;
    const deleted = await messageService.deleteMessage(
      req.user.id,
      id,
      req.projectRole // injected by checkProjectAccess middleware
    );

    return res.json(
      new ApiResponse({
        message: "Message deleted",
        data: deleted,
      })
    );
  }
}

module.exports = new MessageController();
