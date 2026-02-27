import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

export const getPatientByUserId = async (userId) => {
  const patient = await prisma.patient.findUnique({
    where: { userId },
    include: {
      user: { select: { ldapId: true, role: true, isActive: true } },
    },
  });
  if (!patient) throw new ApiError(404, "Patient profile not found");
  return patient;
};

export const getPatientById = async (id) => {
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      user: { select: { ldapId: true, role: true } },
    },
  });
  if (!patient) throw new ApiError(404, "Patient not found");
  return patient;
};

// REQ-15: reception staff scans QR code to identify patient
export const getPatientByQrCode = async (qrCode) => {
  const patient = await prisma.patient.findUnique({
    where: { qrCode },
    include: {
      user: { select: { ldapId: true, isActive: true } },
    },
  });
  if (!patient) throw new ApiError(404, "No patient found for this QR code");
  return patient;
};

export const updatePatientProfile = async (userId, data) => {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) throw new ApiError(404, "Patient profile not found");

  const allowed = ["name", "dob", "email", "bloodGroup", "phone", "address"];
  const updateData = Object.fromEntries(
    Object.entries(data).filter(([k]) => allowed.includes(k))
  );

  return prisma.patient.update({ where: { userId }, data: updateData });
};

// REQ-10: store and retrieve patient visit history
export const getPatientVisitHistory = async (patientId) => {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new ApiError(404, "Patient not found");

  return prisma.visit.findMany({
    where: { patientId },
    include: {
      doctor: {
        select: { name: true, doctorType: true, specialization: true },
      },
      vitals: true,
      prescription: { select: { id: true, isDispensed: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};
