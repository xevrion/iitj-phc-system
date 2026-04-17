import { ApiError } from "../utils/ApiError.js";

const buildRateLimitKey = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const clientIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0]?.trim();

  return clientIp || req.ip || "unknown";
};

export const createRateLimiter = ({
  windowMs,
  maxRequests,
  message,
  skip = () => false,
}) => {
  const requestLog = new Map();

  return (req, _res, next) => {
    if (skip(req)) {
      next();
      return;
    }

    const now = Date.now();
    const key = buildRateLimitKey(req);
    const windowStart = now - windowMs;
    const recentRequests = (requestLog.get(key) || []).filter(
      (timestamp) => timestamp > windowStart
    );

    if (recentRequests.length >= maxRequests) {
      next(new ApiError(429, message));
      return;
    }

    recentRequests.push(now);
    requestLog.set(key, recentRequests);
    next();
  };
};
