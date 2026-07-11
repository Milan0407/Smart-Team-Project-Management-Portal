const Joi = require("joi");

const refreshSchema = Joi.object({
  refreshToken: Joi.string()
    .required(),
});

const validateRefresh = (data) =>
  refreshSchema.validate(data, {
    abortEarly: false,
  });

module.exports = {
  validateRefresh,
};