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

  otp: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "OTP must be a 6 digit code",
    }),
});

const validateRegister = (data) =>
  registerSchema.validate(data, {
    abortEarly: false,
  });

module.exports = {
  validateRegister,
};
