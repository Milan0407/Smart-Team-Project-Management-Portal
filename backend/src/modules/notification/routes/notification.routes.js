const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");
const authenticate = require("../../auth/middleware/authenticate.middleware");
const asyncHandler = require("../../../shared/middleware/asyncHandler.middleware");

router.get(
  "/",
  authenticate,
  asyncHandler(notificationController.getNotifications.bind(notificationController))
);

router.get(
  "/unread-count",
  authenticate,
  asyncHandler(notificationController.getUnreadCount.bind(notificationController))
);

router.patch(
  "/read",
  authenticate,
  asyncHandler(notificationController.markAllRead.bind(notificationController))
);

router.patch(
  "/:id/read",
  authenticate,
  asyncHandler(notificationController.markRead.bind(notificationController))
);

module.exports = router;
