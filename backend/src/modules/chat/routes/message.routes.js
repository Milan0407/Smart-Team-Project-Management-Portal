const express = require("express");
const router = express.Router();

const messageController = require("../controllers/message.controller");
const authenticate = require("../../auth/middleware/authenticate.middleware");
const { checkProjectAccess } = require("../../project/middleware/projectAuth.middleware");
const validate = require("../../../shared/middleware/validate.middleware");
const asyncHandler = require("../../../shared/middleware/asyncHandler.middleware");

const {
  validateCreateMessage,
  validateEditMessage,
} = require("../validators/message.validator");

/*
|--------------------------------------------------------------------------
| Chat Routes — all scoped under /projects/:projectId/messages
|--------------------------------------------------------------------------
*/

router.get(
  "/projects/:projectId/messages",
  authenticate,
  checkProjectAccess(),
  asyncHandler(messageController.getMessages.bind(messageController))
);

router.post(
  "/projects/:projectId/messages",
  authenticate,
  checkProjectAccess(),
  validate(validateCreateMessage),
  asyncHandler(messageController.sendMessage.bind(messageController))
);

router.patch(
  "/projects/:projectId/messages/:id",
  authenticate,
  checkProjectAccess(),
  validate(validateEditMessage),
  asyncHandler(messageController.editMessage.bind(messageController))
);

router.delete(
  "/projects/:projectId/messages/:id",
  authenticate,
  checkProjectAccess(),
  asyncHandler(messageController.deleteMessage.bind(messageController))
);

module.exports = router;
