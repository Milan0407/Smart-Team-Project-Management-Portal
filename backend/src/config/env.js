const dotenv = require("dotenv");
const dotenvSafe = require("dotenv-safe");

dotenv.config();

dotenvSafe.config({
  allowEmptyValues: true,
});

const env = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,

  mongoUri: process.env.MONGODB_URI,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,

  clientUrl: process.env.CLIENT_URL,
};

module.exports = env;