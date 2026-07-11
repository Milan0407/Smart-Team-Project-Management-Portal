const Joi = require("joi");

const updateDepartmentSchema =
  Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(100),

    description: Joi.string()
      .trim()
      .max(500)
      .allow(""),

    managerId: Joi.string()
      .hex()
      .length(24)
      .allow("", null),

    parentDeptId: Joi.string()
      .hex()
      .length(24)
      .allow("", null),

    isActive: Joi.boolean(),
  }).min(1);

const validateUpdateDepartment =
  (data) =>
    updateDepartmentSchema.validate(
      data,
      {
        abortEarly: false,
      }
    );

module.exports = {
  validateUpdateDepartment,
};