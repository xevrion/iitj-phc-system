import jwt from "jsonwebtoken";
import { Client } from "ldapts";
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

const getUserDn = (ldapId) =>
  `uid=${ldapId},${config.ldap.usersOu},${config.ldap.baseDn}`;

const verifyLdapCredentials = async (ldapId, password) => {
  if (!config.ldap.url) {
    throw new ApiError(500, "LDAP_URL is not configured");
  }

  const client = new Client({
    url: config.ldap.url,
    timeout: 5000,
    connectTimeout: 5000,
  });

  try {
    await client.bind(getUserDn(ldapId), password);
    return true;
  } catch (error) {
    if (
      error?.name === "InvalidCredentialsError" ||
      error?.message?.includes("InvalidCredentialsError") ||
      error?.message?.includes("invalidCredentials")
    ) {
      throw new ApiError(401, "Invalid credentials");
    }

    throw new ApiError(503, "LDAP authentication service unavailable");
  } finally {
    await client.unbind().catch(() => {});
  }
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
