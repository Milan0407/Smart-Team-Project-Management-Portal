const Joi = require("joi");

const ROLES = require(
  "../../../shared/constants/roles.constants"
);

const addTeamMemberSchema =
  Joi.object({
    userId: Joi.string()
      .hex()
      .length(24)
      .required(),

    role: Joi.string()
      .valid(
        ...Object.values(ROLES)
      )
      .required(),
  });

const validateAddTeamMember = (
  data
) =>
  addTeamMemberSchema.validate(
    data,
    {
      abortEarly: false,
    }
  );

module.exports = {
  validateAddTeamMember,
};