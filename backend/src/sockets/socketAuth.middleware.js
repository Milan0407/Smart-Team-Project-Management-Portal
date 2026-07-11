const { verifyAccessToken } = require("../modules/auth/utils/token.util");

const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (!token) {
      return next(new Error("Authentication error: Token not provided"));
    }

    // Handle Bearer prefix if present
    const cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
    const decoded = verifyAccessToken(cleanToken);

    socket.user = decoded; // Contains user ID (id) and email
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid or expired token"));
  }
};

module.exports = socketAuthMiddleware;
