import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

// REQ-17, REQ-28: reception creates a visit and generates a VisitID
export const createVisit = async ({ patientId, doctorId, visitType, vitals }) => {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new ApiError(404, "Patient not found");

  if (doctorId) {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new ApiError(404, "Doctor not found");
    if (!doctor.isAvailable)
      throw new ApiError(400, "Selected doctor is currently unavailable");
  }

  return prisma.visit.create({
    data: {
      patientId,
      doctorId: doctorId || null,
      visitType,
      visitStatus: "WAITING",
      ...(vitals && {
        vitals: {
          create: {
            weight: vitals.weight ?? null,
            temperature: vitals.temperature ?? null,
            bloodPressure: vitals.bloodPressure ?? null,
          },
        },
      }),
    },
    include: { vitals: true },
  });
};

export const getVisit = async (visitId) => {
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      patient: {
        select: { id: true, name: true, bloodGroup: true, qrCode: true },
      },
      doctor: {
        select: { id: true, name: true, doctorType: true, specialization: true },
      },
      vitals: true,
      prescription: { include: { items: { include: { medicine: true } } } },
      labRequests: { include: { report: true } },
      bill: true,
    },
  });
  if (!visit) throw new ApiError(404, "Visit not found");
  return visit;
};

// Reception enters vitals at check-in (REQ-16, Figure 4.2)
export const upsertVitals = async (visitId, vitals) => {
  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new ApiError(404, "Visit not found");

  return prisma.visitVitals.upsert({
    where: { visitId },
    create: { visitId, ...vitals },
    update: vitals,
  });
};

// REQ-22: doctor claims a visit, preventing concurrent access
export const claimVisit = async (visitId, doctorUserId) => {
  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new ApiError(404, "Visit not found");
  if (visit.visitStatus !== "WAITING")
    throw new ApiError(400, "Only WAITING visits can be claimed");

  const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  return prisma.visit.update({
    where: { id: visitId },
    data: { doctorId: doctor.id, visitStatus: "IN_CONSULTATION" },
  });
};

// REQ-24: doctor records clinical observations
export const saveConsultationNotes = async (visitId, consultationNotes, doctorUserId) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new ApiError(404, "Visit not found");
  if (visit.doctorId !== doctor.id)
    throw new ApiError(403, "You are not assigned to this visit");

  return prisma.visit.update({
    where: { id: visitId },
    data: { consultationNotes },
  });
};

export const completeVisit = async (visitId, doctorUserId) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new ApiError(404, "Visit not found");
  if (visit.doctorId !== doctor.id)
    throw new ApiError(403, "You are not assigned to this visit");
  if (visit.visitStatus !== "IN_CONSULTATION")
    throw new ApiError(400, "Visit is not currently in consultation");

  return prisma.visit.update({
    where: { id: visitId },
    data: { visitStatus: "COMPLETED", closedAt: new Date() },
  });
};

export const cancelVisit = async (visitId) => {
  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new ApiError(404, "Visit not found");
  if (visit.visitStatus === "COMPLETED")
    throw new ApiError(400, "Cannot cancel a completed visit");

  return prisma.visit.update({
    where: { id: visitId },
    data: { visitStatus: "CANCELLED", closedAt: new Date() },
  });
};

// REQ-21: returns waiting visits assigned to or unassigned for this doctor
export const getDoctorQueue = async (doctorUserId) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  return prisma.visit.findMany({
    where: { doctorId: doctor.id, visitStatus: "WAITING" },
    include: {
      patient: { select: { id: true, name: true, bloodGroup: true } },
      vitals: true,
    },
    orderBy: { createdAt: "asc" },
  });
};

export const getMyCurrentVisit = async (patientUserId) => {
  const patient = await prisma.patient.findUnique({
    where: { userId: patientUserId },
    select: { id: true },
  });
  if (!patient) throw new ApiError(404, "Patient profile not found");

  const visit = await prisma.visit.findFirst({
    where: {
      patientId: patient.id,
      visitStatus: {
        in: ["WAITING", "IN_CONSULTATION"],
      },
    },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          doctorType: true,
          specialization: true,
        },
      },
      vitals: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!visit) {
    return null;
  }

  if (visit.visitStatus !== "WAITING" || !visit.doctorId) {
    return {
      ...visit,
      queuePosition: null,
      waitingAhead: null,
      totalWaitingForDoctor: null,
    };
  }

  const [waitingAhead, totalWaitingForDoctor] = await prisma.$transaction([
    prisma.visit.count({
      where: {
        doctorId: visit.doctorId,
        visitStatus: "WAITING",
        createdAt: {
          lt: visit.createdAt,
        },
      },
    }),
    prisma.visit.count({
      where: {
        doctorId: visit.doctorId,
        visitStatus: "WAITING",
      },
    }),
  ]);

  return {
    ...visit,
    queuePosition: waitingAhead + 1,
    waitingAhead,
    totalWaitingForDoctor,
  };
};
