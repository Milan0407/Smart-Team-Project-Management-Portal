const Joi = require("joi");
const ROLES = require("../../../shared/constants/roles.constants");

const createJoinRequestSchema = Joi.object({
  orgSlug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9-]+$/)
    .min(2)
    .max(120)
    .required(),

  role: Joi.string()
    .valid(...Object.values(ROLES))
    .required(),
});

const resolveJoinRequestSchema = Joi.object({
  action: Joi.string()
    .valid("approve", "reject")
    .required(),
});

const validateCreateJoinRequest = (data) =>
  createJoinRequestSchema.validate(data, { abortEarly: false });

const validateResolveJoinRequest = (data) =>
  resolveJoinRequestSchema.validate(data, { abortEarly: false });

module.exports = {
  validateCreateJoinRequest,
  validateResolveJoinRequest,
};
