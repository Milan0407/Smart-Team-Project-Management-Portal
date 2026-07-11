const Joi = require("joi");

const sendDmSchema = Joi.object({
  content: Joi.string().trim().min(1).max(4000).required(),
});

const editDmSchema = Joi.object({
  content: Joi.string().trim().min(1).max(4000).required(),
});

const startConversationSchema = Joi.object({
  targetUserId: Joi.string().hex().length(24).required(),
});

const validateSendDm = (data) =>
  sendDmSchema.validate(data, { abortEarly: false });

const validateEditDm = (data) =>
  editDmSchema.validate(data, { abortEarly: false });

const validateStartConversation = (data) =>
  startConversationSchema.validate(data, { abortEarly: false });

module.exports = {
  validateSendDm,
  validateEditDm,
  validateStartConversation,
};
