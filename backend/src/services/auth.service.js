import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, ldapId: user.ldapId, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiry }
  );
};

// Verifies credentials against IITJ LDAP when LDAP_URL is configured (TBD-7).
// Falls back to existence check in dev mode when LDAP_URL is not set.
const verifyLdapCredentials = async (ldapId, password) => {
  if (config.ldap.url) {
    // TODO: bind against ldap.url using ldapjs when TBD-7 is resolved
    throw new ApiError(501, "LDAP integration not yet configured (TBD-7)");
  }
  // Dev mode: credential verification is skipped, user existence is enough
  return true;
};

export const loginUser = async (ldapId, password) => {
  if (!ldapId || !password) {
    throw new ApiError(400, "ldapId and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { ldapId },
    select: { id: true, ldapId: true, role: true, isActive: true },
  });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.isActive) {
    throw new ApiError(401, "Account is deactivated");
  }

  await verifyLdapCredentials(ldapId, password);

  const token = generateToken(user);
  return { token, user };
};

export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      ldapId: true,
      role: true,
      isActive: true,
      createdAt: true,
      patient: { select: { id: true, name: true, qrCode: true } },
      doctor: {
        select: { id: true, name: true, doctorType: true, isAvailable: true },
      },
    },
  });

  if (!user) throw new ApiError(404, "User not found");
  return user;
};
