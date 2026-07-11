const Joi = require("joi");

const assignTeamLeadSchema =
  Joi.object({
    leadId: Joi.string()
      .hex()
      .length(24)
      .required(),
  });

const validateAssignTeamLead = (
  data
) =>
  assignTeamLeadSchema.validate(
    data,
    {
      abortEarly: false,
    }
  );

module.exports = {
  validateAssignTeamLead,
};