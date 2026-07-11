const Joi = require("joi");

const createProjectSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  key: Joi.string()
    .trim()
    .uppercase()
    .min(2)
    .max(10)
    .required(),

  description: Joi.string()
    .trim()
    .max(500)
    .allow("")
    .optional(),

  leadId: Joi.string()
    .hex()
    .length(24)
    .required(),
});

const validateCreateProject = (data) =>
  createProjectSchema.validate(data, {
    abortEarly: false,
  });

module.exports = {
  validateCreateProject,
};
