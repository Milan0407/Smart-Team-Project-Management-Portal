const Joi = require("joi");

const assignDepartmentManagerSchema =
  Joi.object({
    managerId: Joi.string()
      .hex()
      .length(24)
      .required(),
  });

const validateAssignDepartmentManager =
  (data) =>
    assignDepartmentManagerSchema.validate(
      data,
      {
        abortEarly: false,
      }
    );

module.exports = {
  validateAssignDepartmentManager,
};