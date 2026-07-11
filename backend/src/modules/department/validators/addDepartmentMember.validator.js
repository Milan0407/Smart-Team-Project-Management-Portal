const Joi = require("joi");

const ROLES = require(
  "../../../shared/constants/roles.constants"
);

const addDepartmentMemberSchema =
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

const validateAddDepartmentMember =
  (data) =>
    addDepartmentMemberSchema.validate(
      data,
      {
        abortEarly: false,
      }
    );

module.exports = {
  validateAddDepartmentMember,
};