import { ApiError } from "../utils/ApiError.js";

const FORBIDDEN_KEYS = ["__proto__", "constructor", "prototype"];

const sanitizeValue = (value) => {
  if (typeof value === "string") {
    return value.replace(/\0/g, "").trim();
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !FORBIDDEN_KEYS.includes(key))
        .map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)])
    );
  }

  return value;
};

export const sanitizeRequestBody = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }

  next();
};

export const enforceHttps = (req, _res, next) => {
  if (process.env.NODE_ENV !== "production") {
    next();
    return;
  }

  if (process.env.ENFORCE_HTTPS !== "true") {
    next();
    return;
  }

  const forwardedProto = req.headers["x-forwarded-proto"];
  const isSecure =
    req.secure ||
    forwardedProto === "https" ||
    (Array.isArray(forwardedProto) && forwardedProto.includes("https"));

  if (!isSecure) {
    next(new ApiError(403, "HTTPS is required in production"));
    return;
  }

  next();
};
