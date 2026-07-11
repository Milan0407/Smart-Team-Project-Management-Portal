const {
  verifyAccessToken,
} = require("../utils/token.util");

const AuthError = require(
  "../../../shared/errors/AuthError"
);

const authenticate = (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      throw new AuthError(
        "Authentication required"
      );
    }

    const token =
      authHeader.split(" ")[1];

    const payload =
      verifyAccessToken(token);

    req.user = payload;

    next();
  } catch (error) {
    next(
      new AuthError(
        "Invalid or expired token"
      )
    );
  }
};

module.exports = authenticate;