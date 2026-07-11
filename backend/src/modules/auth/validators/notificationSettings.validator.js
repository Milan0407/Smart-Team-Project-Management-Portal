const Joi = require("joi");

const settingsSchema = Joi.object({
  taskAssigned: Joi.object({
    email: Joi.boolean(),
    inApp: Joi.boolean(),
  }),
  commentMention: Joi.object({
    email: Joi.boolean(),
    inApp: Joi.boolean(),
  }),
  wikiUpdated: Joi.object({
    email: Joi.boolean(),
    inApp: Joi.boolean(),
  }),
});

const validateNotificationSettings = (data) =>
  settingsSchema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
  });

module.exports = {
  validateNotificationSettings,
};
