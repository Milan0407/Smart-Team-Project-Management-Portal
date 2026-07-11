const Joi = require("joi");

const ROLES = require(
  "../../../shared/constants/roles.constants"
);

const inviteMemberSchema =
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

const validateInviteMember = (
  data
) =>
  inviteMemberSchema.validate(
    data,
    {
      abortEarly: false,
    }
  );

module.exports = {
  validateInviteMember,
};