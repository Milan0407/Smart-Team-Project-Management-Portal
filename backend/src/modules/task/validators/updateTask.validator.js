const Joi = require("joi");

const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).optional(),

  description: Joi.string().trim().max(5000).allow("").optional(),

  assigneeId: Joi.string().hex().length(24).allow("", null).optional(),

  priority: Joi.string()
    .valid("low", "medium", "high", "critical")
    .optional(),

  status: Joi.string()
    .valid("todo", "in_progress", "in_review", "done", "cancelled")
    .optional(),

  dueDate: Joi.date().iso().allow(null).optional(),

  boardId: Joi.string().hex().length(24).allow("", null).optional(),

  columnName: Joi.string().trim().max(100).allow("", null).optional(),
}).min(1);

const validateUpdateTask = (data) =>
  updateTaskSchema.validate(data, { abortEarly: false });

module.exports = { validateUpdateTask };
