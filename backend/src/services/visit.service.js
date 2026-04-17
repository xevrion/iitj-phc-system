import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { cache } from "../utils/cache.js";

const VISIT_CACHE_TTL_MS = 5 * 1000;
const VISIT_DETAIL_CACHE_TTL_MS = 15 * 1000;
const VISIT_CACHE_PREFIX = "visit:";

const invalidateVisitCaches = ({ visitId, patientId, doctorId } = {}) => {
  cache.delPrefix(VISIT_CACHE_PREFIX);

  if (visitId) {
    cache.del(`${VISIT_CACHE_PREFIX}detail:${visitId}`);
  }

  if (patientId) {
    cache.del(`${VISIT_CACHE_PREFIX}patient-current:${patientId}`);
  }

  if (doctorId) {
    cache.del(`${VISIT_CACHE_PREFIX}doctor-queue:${doctorId}`);
  }
};

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

  const visit = await prisma.visit.create({
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

  invalidateVisitCaches({ patientId, doctorId });
  return visit;
};

export const getVisit = async (visitId) => {
  const visit = await cache.getOrSet(
    `${VISIT_CACHE_PREFIX}detail:${visitId}`,
    VISIT_DETAIL_CACHE_TTL_MS,
    () =>
      prisma.visit.findUnique({
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
      })
  );
  if (!visit) throw new ApiError(404, "Visit not found");
  return visit;
};

// Reception enters vitals at check-in (REQ-16, Figure 4.2)
export const upsertVitals = async (visitId, vitals) => {
  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new ApiError(404, "Visit not found");

  const updatedVitals = await prisma.visitVitals.upsert({
    where: { visitId },
    create: { visitId, ...vitals },
    update: vitals,
  });

  invalidateVisitCaches({ visitId, patientId: visit.patientId, doctorId: visit.doctorId });
  return updatedVitals;
};

// REQ-22: doctor claims a visit, preventing concurrent access
export const claimVisit = async (visitId, doctorUserId) => {
  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new ApiError(404, "Visit not found");
  if (visit.visitStatus !== "WAITING")
    throw new ApiError(400, "Only WAITING visits can be claimed");

  const doctor = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
    select: { id: true, isAvailable: true },
  });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  const activeAttendance = await prisma.doctorAttendance.findFirst({
    where: { doctorId: doctor.id, checkOut: null },
    select: { id: true },
  });
  if (!activeAttendance) {
    throw new ApiError(400, "Check in before claiming patients");
  }
  if (!doctor.isAvailable) {
    throw new ApiError(400, "Open consultations before claiming patients");
  }

  const updatedVisit = await prisma.visit.update({
    where: { id: visitId },
    data: { doctorId: doctor.id, visitStatus: "IN_CONSULTATION" },
  });

  invalidateVisitCaches({ visitId, patientId: visit.patientId, doctorId: doctor.id });
  return updatedVisit;
};

// REQ-24: doctor records clinical observations
export const saveConsultationNotes = async (visitId, consultationNotes, doctorUserId) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new ApiError(404, "Visit not found");
  if (visit.doctorId !== doctor.id)
    throw new ApiError(403, "You are not assigned to this visit");

  const updatedVisit = await prisma.visit.update({
    where: { id: visitId },
    data: { consultationNotes },
  });

  invalidateVisitCaches({ visitId, patientId: visit.patientId, doctorId: doctor.id });
  return updatedVisit;
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

  const updatedVisit = await prisma.visit.update({
    where: { id: visitId },
    data: { visitStatus: "COMPLETED", closedAt: new Date() },
  });

  invalidateVisitCaches({ visitId, patientId: visit.patientId, doctorId: doctor.id });
  return updatedVisit;
};

export const cancelVisit = async (visitId) => {
  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new ApiError(404, "Visit not found");
  if (visit.visitStatus === "COMPLETED")
    throw new ApiError(400, "Cannot cancel a completed visit");

  const updatedVisit = await prisma.visit.update({
    where: { id: visitId },
    data: { visitStatus: "CANCELLED", closedAt: new Date() },
  });

  invalidateVisitCaches({ visitId, patientId: visit.patientId, doctorId: visit.doctorId });
  return updatedVisit;
};

// REQ-21: returns waiting visits assigned to or unassigned for this doctor
export const getDoctorQueue = async (doctorUserId) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  return cache.getOrSet(
    `${VISIT_CACHE_PREFIX}doctor-queue:${doctor.id}`,
    VISIT_CACHE_TTL_MS,
    () =>
      prisma.visit.findMany({
        where: { doctorId: doctor.id, visitStatus: "WAITING" },
        include: {
          patient: { select: { id: true, name: true, bloodGroup: true } },
          vitals: true,
        },
        orderBy: { createdAt: "asc" },
      })
  );
};

export const getReceptionLiveQueue = async () => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const { activeVisits, todayVisits } = await cache.getOrSet(
    `${VISIT_CACHE_PREFIX}reception-live-queue`,
    VISIT_CACHE_TTL_MS,
    async () => {
      const [activeVisits, todayVisits] = await prisma.$transaction([
        prisma.visit.findMany({
          where: {
            visitStatus: {
              in: ["WAITING", "IN_CONSULTATION"],
            },
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                bloodGroup: true,
              },
            },
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
          orderBy: [{ createdAt: "asc" }],
        }),
        prisma.visit.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
      ]);

      return { activeVisits, todayVisits };
    }
  );

  const waitingCounters = new Map();
  const enrichedVisits = activeVisits.map((visit) => {
    const queueKey = visit.doctorId || "unassigned";
    const currentCount = waitingCounters.get(queueKey) || 0;

    if (visit.visitStatus === "WAITING") {
      waitingCounters.set(queueKey, currentCount + 1);
    }

    const waitMinutes = Math.max(
      0,
      Math.round((now.getTime() - new Date(visit.createdAt).getTime()) / 60000)
    );

    return {
      ...visit,
      waitMinutes,
      queuePosition:
        visit.visitStatus === "WAITING" ? currentCount + 1 : null,
    };
  });

  const waitingVisits = enrichedVisits.filter((visit) => visit.visitStatus === "WAITING");
  const consultationVisits = enrichedVisits.filter(
    (visit) => visit.visitStatus === "IN_CONSULTATION"
  );
  const averageWaitMinutes = waitingVisits.length
    ? Math.round(
        waitingVisits.reduce((sum, visit) => sum + visit.waitMinutes, 0) /
          waitingVisits.length
      )
    : 0;

  return {
    summary: {
      todayVisits,
      waitingCount: waitingVisits.length,
      inConsultationCount: consultationVisits.length,
      averageWaitMinutes,
    },
    waitingVisits,
    consultationVisits,
  };
};

export const getMyCurrentVisit = async (patientUserId) => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const patient = await prisma.patient.findUnique({
    where: { userId: patientUserId },
    select: { id: true },
  });
  if (!patient) throw new ApiError(404, "Patient profile not found");

  return cache.getOrSet(
    `${VISIT_CACHE_PREFIX}patient-current:${patient.id}`,
    VISIT_CACHE_TTL_MS,
    async () => {
      const visit = await prisma.visit.findFirst({
        where: {
          patientId: patient.id,
          visitStatus: {
            in: ["WAITING", "IN_CONSULTATION"],
          },
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
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
    }
  );
};
