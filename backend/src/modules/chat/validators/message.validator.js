const Joi = require("joi");

/*
|--------------------------------------------------------------------------
| Create Message Validator
|--------------------------------------------------------------------------
*/
const createMessageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(4000).required(),

  type: Joi.string().valid("text", "system").optional(),

  replyTo: Joi.string().hex().length(24).allow("", null).optional(),
});

const validateCreateMessage = (data) =>
  createMessageSchema.validate(data, { abortEarly: false });

/*
|--------------------------------------------------------------------------
| Edit Message Validator
|--------------------------------------------------------------------------
*/
const editMessageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(4000).required(),
});

const validateEditMessage = (data) =>
  editMessageSchema.validate(data, { abortEarly: false });

/*
|--------------------------------------------------------------------------
| Get Messages Query Validator
|--------------------------------------------------------------------------
*/
const getMessagesSchema = Joi.object({
  cursor: Joi.string().isoDate().optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

const validateGetMessages = (data) =>
  getMessagesSchema.validate(data, { abortEarly: false });

module.exports = {
  validateCreateMessage,
  validateEditMessage,
  validateGetMessages,
};
