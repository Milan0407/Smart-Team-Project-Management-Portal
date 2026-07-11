const Joi = require("joi");

const updateBoardSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  columns: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().required(),
        order: Joi.number().integer().min(0).required(),
        color: Joi.string().trim().max(20).optional(),
      })
    )
    .optional(),
}).min(1);

const validateUpdateBoard = (data) =>
  updateBoardSchema.validate(data, {
    abortEarly: false,
  });

module.exports = {
  validateUpdateBoard,
};
