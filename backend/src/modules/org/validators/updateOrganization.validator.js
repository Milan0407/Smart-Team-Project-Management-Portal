const Joi = require("joi");

const updateOrganizationSchema =
  Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(100),

    plan: Joi.string().valid(
      "free",
      "pro",
      "enterprise"
    ),

    settings: Joi.object({
      branding: Joi.object({
        logo: Joi.string()
          .allow("")
          .optional(),

        primaryColor:
          Joi.string().optional(),
      }).optional(),

      features: Joi.object({
        projects:
          Joi.boolean(),

        chat:
          Joi.boolean(),

        documents:
          Joi.boolean(),
      }).optional(),
    }).optional(),

    isActive: Joi.boolean(),
  }).min(1);

const validateUpdateOrganization = (
  data
) =>
  updateOrganizationSchema.validate(
    data,
    {
      abortEarly: false,
    }
  );

module.exports = {
  validateUpdateOrganization,
};