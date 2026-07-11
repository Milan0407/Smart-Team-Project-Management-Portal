const notificationService = require("../services/notification.service");
const ApiResponse = require("../../../shared/utils/ApiResponse");

class NotificationController {
  async getNotifications(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const result = await notificationService.getNotifications(req.user.id, page, limit);

    return res.json(
      new ApiResponse({
        message: "Notifications fetched successfully",
        data: result,
      })
    );
  }

  async getUnreadCount(req, res) {
    const result = await notificationService.getUnreadCount(req.user.id);
    return res.json(
      new ApiResponse({
        message: "Unread count fetched successfully",
        data: result,
      })
    );
  }

  async markAllRead(req, res) {
    const result = await notificationService.markAllRead(req.user.id);
    return res.json(
      new ApiResponse({
        message: "All notifications marked as read",
        data: result,
      })
    );
  }

  async markRead(req, res) {
    const result = await notificationService.markRead(req.params.id, req.user.id);
    return res.json(
      new ApiResponse({
        message: "Notification marked as read",
        data: result,
      })
    );
  }
}

module.exports = new NotificationController();
