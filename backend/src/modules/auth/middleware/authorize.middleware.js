const ForbiddenError = require(
  "../../../shared/errors/ForbiddenError"
);

const authorize =
  (...permissions) =>
  (req, res, next) => {
    const userPermissions =
      req.user?.permissions || [];

    const allowed =
      permissions.every(
        (permission) =>
          userPermissions.includes(
            permission
          )
      );

    if (!allowed) {
      return next(
        new ForbiddenError(
          "Insufficient permissions"
        )
      );
    }

    next();
  };

module.exports = authorize;