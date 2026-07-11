const ValidationError = require(
  "../errors/ValidationError"
);

const validate =
  (validator) =>
  (req, res, next) => {
    const { error } =
      validator(req.body);

    if (error) {
      return next(
        new ValidationError(
          error.details
            .map(
              (item) =>
                item.message
            )
            .join(", ")
        )
      );
    }

    next();
  };

module.exports = validate;