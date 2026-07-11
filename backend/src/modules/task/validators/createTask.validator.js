const Joi = require("joi");

const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),

  description: Joi.string().trim().max(5000).allow("").optional(),

  assigneeId: Joi.string().hex().length(24).allow("", null).optional(),

  priority: Joi.string()
    .valid("low", "medium", "high", "critical")
    .optional(),

  dueDate: Joi.date().iso().allow(null).optional(),

  boardId: Joi.string().hex().length(24).allow("", null).optional(),

  columnName: Joi.string().trim().max(100).allow("", null).optional(),
});

const validateCreateTask = (data) =>
  createTaskSchema.validate(data, { abortEarly: false });

module.exports = { validateCreateTask };
