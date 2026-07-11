const Joi = require("joi");

const changePasswordSchema =
  Joi.object({
    currentPassword:
      Joi.string().required(),

    newPassword: Joi.string()
      .min(8)
      .max(128)
      .required(),
  });

const validateChangePassword = (
  data
) =>
  changePasswordSchema.validate(
    data,
    {
      abortEarly: false,
    }
  );

module.exports = {
  validateChangePassword,
};