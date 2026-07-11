const Joi = require("joi");

const createDepartmentSchema =
  Joi.object({
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

    parentDeptId: Joi.string()
      .hex()
      .length(24)
      .allow("", null)
      .optional(),

    managerId: Joi.string()
      .hex()
      .length(24)
      .allow("", null)
      .optional(),
  });

const validateCreateDepartment =
  (data) =>
    createDepartmentSchema.validate(
      data,
      {
        abortEarly: false,
      }
    );

module.exports = {
  validateCreateDepartment,
};