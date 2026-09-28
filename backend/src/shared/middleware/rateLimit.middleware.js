const AppError = require("../errors/AppError");

const buckets = new Map();

const getClientKey = (req) =>
  req.ip ||
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
  req.socket?.remoteAddress ||
  "unknown";

const rateLimit = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Too many requests. Please try again later.",
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = getClientKey(req);
    const record = buckets.get(key);

    if (!record || record.expiresAt <= now) {
      buckets.set(key, {
        count: 1,
        expiresAt: now + windowMs,
      });
      next();
      return;
    }

    record.count += 1;

    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.expiresAt - now) / 1000);
      res.set("Retry-After", String(retryAfterSeconds));
      next(new AppError(message, 429));
      return;
    }

    next();
  };
};

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of buckets.entries()) {
    if (record.expiresAt <= now) {
      buckets.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

module.exports = rateLimit;
