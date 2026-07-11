const Joi = require("joi");

const createOrganizationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9-]+$/)
    .min(2)
    .max(120)
    .required(),

  plan: Joi.string()
    .valid(
      "free",
      "pro",
      "enterprise"
    )
    .optional(),
});

const validateCreateOrganization = (
  data
) =>
  createOrganizationSchema.validate(
    data,
    {
      abortEarly: false,
    }
  );

module.exports = {
  validateCreateOrganization,
};