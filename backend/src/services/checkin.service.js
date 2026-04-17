import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { getPatientByQrCode } from "./patient.service.js";
import { resolveAssignedDoctorId } from "./visit.service.js";

// REQ-15, REQ-26: reception staff scans QR code, creates visit atomically
export const qrCheckIn = async ({ qrCode, visitType, vitals }) => {
  if (!qrCode) throw new ApiError(400, "qrCode is required");
  if (!visitType) throw new ApiError(400, "visitType is required");

  const validTypes = ["OPD", "ADMIT", "EMERGENCY"];
  if (!validTypes.includes(visitType))
    throw new ApiError(400, `visitType must be one of: ${validTypes.join(", ")}`);

  const patient = await getPatientByQrCode(qrCode);
  const doctorId = await resolveAssignedDoctorId();

  const vitalsData = vitals
    ? {
        vitals: {
          create: {
            weight: vitals.weight ?? null,
            temperature: vitals.temperature ?? null,
            bloodPressure: vitals.bloodPressure ?? null,
          },
        },
      }
    : {};

  const visit = await prisma.visit.create({
    data: {
      patientId: patient.id,
      doctorId,
      visitType,
      ...vitalsData,
    },
    include: {
      patient: { select: { id: true, name: true, qrCode: true } },
      doctor: { select: { id: true, name: true, doctorType: true, specialization: true } },
      vitals: true,
    },
  });

  return visit;
};
