const Joi = require("joi");

const moveTaskSchema = Joi.object({
  columnName: Joi.string().trim().max(100).required(),
  order: Joi.number().integer().min(0).optional(),
});

const validateMoveTask = (data) =>
  moveTaskSchema.validate(data, { abortEarly: false });

module.exports = { validateMoveTask };
