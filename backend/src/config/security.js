const env = require("./env");

const localOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const allowedOrigins = new Set([
  ...env.clientUrls,
  ...(env.nodeEnv === "development" ? localOrigins : []),
]);

const normalizeOrigin = (origin) => origin?.replace(/\/+$/, "");

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  return allowedOrigins.has(normalizeOrigin(origin));
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

const socketCorsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by Socket.IO CORS"));
  },
  credentials: true,
};

module.exports = {
  corsOptions,
  socketCorsOptions,
  isAllowedOrigin,
};
