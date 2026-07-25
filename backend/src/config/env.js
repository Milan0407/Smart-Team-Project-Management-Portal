const path = require("path");
const dotenv = require("dotenv");
const dotenvSafe = require("dotenv-safe");

dotenv.config();

try {
  dotenvSafe.config({
    allowEmptyValues: true,
    example: path.join(__dirname, "../../.env.example"),
  });
} catch (err) {
  // Ignored in production if .env file is omitted when environment variables are injected by host
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,

  mongoUri: process.env.MONGODB_URI,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,

  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  smtpHost: process.env.SMTP_HOST || "smtp.ethereal.email",
  smtpPort: parseInt(process.env.SMTP_PORT || "587", 10),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || '"Smart Portal" <no-reply@smartportal.com>',
};

module.exports = env;