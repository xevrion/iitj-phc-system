import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { config } from "../config/index.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.headers.authorization?.replace("Bearer ", "") ||
    req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }

  if (!decoded.isActive) {
    throw new ApiError(401, "Account is deactivated");
  }

  req.user = { id: decoded.userId, ldapId: decoded.ldapId, role: decoded.role, isActive: decoded.isActive };
  next();
});

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new ApiError(403, "Access denied: insufficient permissions");
    }
    next();
  };
};
