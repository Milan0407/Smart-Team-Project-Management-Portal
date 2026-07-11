const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(100)
    .required(),

  email: Joi.string()
    .email()
    .lowercase()
    .required(),

  password: Joi.string()
    .min(8)
    .max(128)
    .required(),
});

const validateRegister = (data) =>
  registerSchema.validate(data, {
    abortEarly: false,
  });

module.exports = {
  validateRegister,
};
