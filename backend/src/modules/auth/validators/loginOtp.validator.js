const Joi = require("joi");

const sendLoginOtpSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .required(),
});

const loginWithOtpSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .required(),

  otp: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "OTP must be a 6 digit code",
    }),
});

const validateSendLoginOtp = (data) =>
  sendLoginOtpSchema.validate(data, {
    abortEarly: false,
  });

const validateLoginWithOtp = (data) =>
  loginWithOtpSchema.validate(data, {
    abortEarly: false,
  });

module.exports = {
  validateSendLoginOtp,
  validateLoginWithOtp,
};
