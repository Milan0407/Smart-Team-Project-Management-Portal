const Joi = require("joi");

const sendRegisterOtpSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .required(),
});

const validateSendRegisterOtp = (data) =>
  sendRegisterOtpSchema.validate(data, {
    abortEarly: false,
  });

module.exports = {
  validateSendRegisterOtp,
};
