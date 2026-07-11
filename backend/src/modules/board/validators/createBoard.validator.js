const Joi = require("joi");

const createBoardSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  columns: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().required(),
        order: Joi.number().integer().min(0).required(),
        color: Joi.string().trim().max(20).optional(),
      })
    )
    .optional(),
});

const validateCreateBoard = (data) =>
  createBoardSchema.validate(data, {
    abortEarly: false,
  });

module.exports = {
  validateCreateBoard,
};
