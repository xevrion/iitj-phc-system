import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { cache } from "../utils/cache.js";

const PROFILE_CACHE_TTL_MS = 60 * 1000;

export const invalidatePatientProfileCacheForUser = (userId) => {
  cache.del(`profile:patient:${userId}`);
};

export const invalidateDoctorProfileCacheForUser = (userId) => {
  cache.del(`profile:doctor:${userId}`);
};

export const invalidateLabStaffProfileCacheForUser = (userId) => {
  cache.del(`profile:lab-staff:${userId}`);
};

const getCachedProfile = async (key, loader, missingMessage) => {
  const profile = await cache.getOrSet(key, PROFILE_CACHE_TTL_MS, loader);

  if (!profile) {
    throw new ApiError(404, missingMessage);
  }

  return profile;
};

export const getPatientProfileForUser = async (userId) =>
  getCachedProfile(
    `profile:patient:${userId}`,
    () =>
      prisma.patient.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          name: true,
          qrCode: true,
          email: true,
          phone: true,
          bloodGroup: true,
        },
      }),
    "Patient profile not found"
  );

export const getDoctorProfileForUser = async (userId) =>
  getCachedProfile(
    `profile:doctor:${userId}`,
    () =>
      prisma.doctor.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          name: true,
          doctorType: true,
          specialization: true,
          isAvailable: true,
        },
      }),
    "Doctor profile not found"
  );

export const getLabStaffProfileForUser = async (userId) =>
  getCachedProfile(
    `profile:lab-staff:${userId}`,
    () =>
      prisma.labStaff.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
        },
      }),
    "Lab staff profile not found"
  );
