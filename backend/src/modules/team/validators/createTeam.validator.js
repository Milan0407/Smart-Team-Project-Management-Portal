const Joi = require("joi");

const createTeamSchema = Joi.object({
  departmentId: Joi.string()
    .hex()
    .length(24)
    .required(),

  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  description: Joi.string()
    .trim()
    .max(500)
    .allow("")
    .optional(),

  color: Joi.string()
    .trim()
    .max(20)
    .optional(),

  leadId: Joi.string()
    .hex()
    .length(24)
    .allow("", null)
    .optional(),
});

const validateCreateTeam = (data) =>
  createTeamSchema.validate(data, {
    abortEarly: false,
  });

module.exports = {
  validateCreateTeam,
};