const Joi = require("joi");

const createDocumentSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  content: Joi.string().allow("").optional(),
  projectId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).allow(null, "").optional().messages({
    "string.pattern.base": "Invalid Project ID",
  }),
});

const updateDocumentSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional(),
  content: Joi.string().allow("").optional(),
  projectId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).allow(null, "").optional().messages({
    "string.pattern.base": "Invalid Project ID",
  }),
});

const validateCreateDocument = (data) =>
  createDocumentSchema.validate(data, {
    abortEarly: false,
  });

const validateUpdateDocument = (data) =>
  updateDocumentSchema.validate(data, {
    abortEarly: false,
  });

module.exports = {
  validateCreateDocument,
  validateUpdateDocument,
};
