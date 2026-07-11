const Joi = require("joi");

const ROLES = require(
  "../../../shared/constants/roles.constants"
);

const updateMemberRoleSchema =
  Joi.object({
    role: Joi.string()
      .valid(
        ...Object.values(ROLES)
      )
      .required(),
  });

const validateUpdateMemberRole =
  (data) =>
    updateMemberRoleSchema.validate(
      data,
      {
        abortEarly: false,
      }
    );

module.exports = {
  validateUpdateMemberRole,
};