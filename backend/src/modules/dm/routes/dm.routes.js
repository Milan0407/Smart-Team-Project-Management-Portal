const express = require("express");
const router = express.Router();

const dmController = require("../controllers/dm.controller");
const authenticate = require("../../auth/middleware/authenticate.middleware");
const validate = require("../../../shared/middleware/validate.middleware");
const asyncHandler = require("../../../shared/middleware/asyncHandler.middleware");
const {
  validateSendDm,
  validateEditDm,
  validateStartConversation,
} = require("../validators/dm.validator");

/*
|--------------------------------------------------------------------------
| DM Routes
|--------------------------------------------------------------------------
*/

// Inbox — all conversations for current user
router.get(
  "/conversations",
  authenticate,
  asyncHandler(dmController.getInbox.bind(dmController))
);

// Start or get conversation with a user
router.post(
  "/conversations",
  authenticate,
  validate(validateStartConversation),
  asyncHandler(dmController.getOrCreateConversation.bind(dmController))
);

// Mark conversation as read
router.patch(
  "/conversations/:id/read",
  authenticate,
  asyncHandler(dmController.markRead.bind(dmController))
);

// Get messages in a conversation (cursor-based)
router.get(
  "/conversations/:id/messages",
  authenticate,
  asyncHandler(dmController.getMessages.bind(dmController))
);

// Send a message
router.post(
  "/conversations/:id/messages",
  authenticate,
  validate(validateSendDm),
  asyncHandler(dmController.sendMessage.bind(dmController))
);

// Edit a message
router.patch(
  "/conversations/:id/messages/:msgId",
  authenticate,
  validate(validateEditDm),
  asyncHandler(dmController.editMessage.bind(dmController))
);

// Delete a message (soft)
router.delete(
  "/conversations/:id/messages/:msgId",
  authenticate,
  asyncHandler(dmController.deleteMessage.bind(dmController))
);

module.exports = router;
