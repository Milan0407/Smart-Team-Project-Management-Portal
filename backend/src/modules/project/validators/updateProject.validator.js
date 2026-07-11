const Joi = require("joi");

const updateProjectSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  description: Joi.string()
    .trim()
    .max(500)
    .allow("")
    .optional(),

  leadId: Joi.string()
    .hex()
    .length(24)
    .optional(),

  status: Joi.string()
    .valid("active", "completed", "archived")
    .optional(),
}).min(1);

const validateUpdateProject = (data) =>
  updateProjectSchema.validate(data, {
    abortEarly: false,
  });

module.exports = {
  validateUpdateProject,
};
