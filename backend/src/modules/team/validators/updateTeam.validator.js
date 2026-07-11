const Joi = require("joi");

const updateTeamSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100),

  description: Joi.string()
    .trim()
    .max(500)
    .allow(""),

  color: Joi.string()
    .trim()
    .max(20),

  leadId: Joi.string()
    .hex()
    .length(24)
    .allow("", null),

  isActive: Joi.boolean(),
}).min(1);

const validateUpdateTeam = (data) =>
  updateTeamSchema.validate(data, {
    abortEarly: false,
  });

module.exports = {
  validateUpdateTeam,
};