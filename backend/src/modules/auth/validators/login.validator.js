const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),

  password: Joi.string()
    .required(),
});

const validateLogin = (data) =>
  loginSchema.validate(data, {
    abortEarly: false,
  });

module.exports = {
  validateLogin,
};