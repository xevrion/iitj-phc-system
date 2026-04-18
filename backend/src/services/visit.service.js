import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { cache } from "../utils/cache.js";
import {
  getDoctorProfileForUser,
  getPatientProfileForUser,
} from "./profile-cache.service.js";

const VISIT_CACHE_TTL_MS = 5 * 1000;
const VISIT_DETAIL_CACHE_TTL_MS = 15 * 1000;
const VISIT_CACHE_PREFIX = "visit:";

export const invalidateAllVisitCaches = () => {
  cache.delPrefix(VISIT_CACHE_PREFIX);
};

const selectAutoAssignedDoctor = (doctors, attendanceRows, waitingRows, appointmentRows) => {
  const checkedInDoctorIds = new Set(attendanceRows.map((row) => row.doctorId));

  const waitingCountByDoctorId = new Map(
    waitingRows.map((row) => [row.doctorId, row._count._all])
  );
  const appointmentCountByDoctorId = new Map(
    appointmentRows.map((row) => [row.doctorId, row._count._all])
  );

  return doctors
    .filter((doctor) => checkedInDoctorIds.has(doctor.id))
    .sort((left, right) => {
      const waitingDiff =
        (waitingCountByDoctorId.get(left.id) || 0) -
        (waitingCountByDoctorId.get(right.id) || 0);
      if (waitingDiff !== 0) {
        return waitingDiff;
      }

      const appointmentDiff =
        (appointmentCountByDoctorId.get(left.id) || 0) -
        (appointmentCountByDoctorId.get(right.id) || 0);
      if (appointmentDiff !== 0) {
        return appointmentDiff;
      }

      return (left.name || left.id).localeCompare(right.name || right.id);
    })[0];
};

export const resolveAssignedDoctorId = async (doctorId = null) => {
  if (doctorId) {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new ApiError(404, "Doctor not found");
    if (!doctor.isAvailable)
      throw new ApiError(400, "Selected doctor is currently unavailable");

    return doctor.id;
  }

  const availableDoctors = await prisma.doctor.findMany({
    where: { isAvailable: true },
    select: {
      id: true,
      name: true,
    },
  });

  if (!availableDoctors.length) {
    throw new ApiError(400, "No available doctor found for auto-assignment");
  }

  const availableDoctorIds = availableDoctors.map((doctor) => doctor.id);
  const now = new Date();

  const [attendanceRows, waitingRows, appointmentRows] = await prisma.$transaction([
    prisma.doctorAttendance.groupBy({
      by: ["doctorId"],
      where: {
        doctorId: { in: availableDoctorIds },
        checkOut: null,
      },
      _count: { _all: true },
    }),
    prisma.visit.groupBy({
      by: ["doctorId"],
      where: {
        doctorId: { in: availableDoctorIds },
        visitStatus: "WAITING",
      },
      _count: { _all: true },
    }),
    prisma.appointment.groupBy({
      by: ["doctorId"],
      where: {
        doctorId: { in: availableDoctorIds },
        status: "BOOKED",
        appointmentTime: { gte: now },
      },
      _count: { _all: true },
    }),
  ]);

  const autoAssignedDoctor = selectAutoAssignedDoctor(
    availableDoctors,
    attendanceRows,
    waitingRows,
    appointmentRows
  );

  if (!autoAssignedDoctor) {
    throw new ApiError(400, "No checked-in available doctor found for auto-assignment");
  }

  return autoAssignedDoctor.id;
};

const invalidateVisitCaches = ({ visitId, patientId, doctorId } = {}) => {
  invalidateAllVisitCaches();

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

export const releaseWaitingVisitsForDoctor = async (tx, doctorId) => {
  const releasedVisits = await tx.visit.updateMany({
    where: {
      doctorId,
      visitStatus: "WAITING",
    },
    data: {
      doctorId: null,
    },
  });

  if (releasedVisits.count > 0) {
    invalidateAllVisitCaches();
  }

  return releasedVisits.count;
};

// REQ-17, REQ-28: reception creates a visit and generates a VisitID
export const createVisit = async ({ patientId, doctorId, visitType, vitals }) => {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new ApiError(404, "Patient not found");

  const assignedDoctorId = await resolveAssignedDoctorId(doctorId);

  const visit = await prisma.visit.create({
    data: {
      patientId,
      doctorId: assignedDoctorId,
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

  invalidateVisitCaches({ patientId, doctorId: assignedDoctorId });
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

  const doctor = await getDoctorProfileForUser(doctorUserId);

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
  const doctor = await getDoctorProfileForUser(doctorUserId);

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
  const doctor = await getDoctorProfileForUser(doctorUserId);

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

// REQ-21: returns active visits for this doctor, including claimed consultations
export const getDoctorQueue = async (doctorUserId) => {
  const doctor = await getDoctorProfileForUser(doctorUserId);

  return cache.getOrSet(
    `${VISIT_CACHE_PREFIX}doctor-queue:${doctor.id}`,
    VISIT_CACHE_TTL_MS,
    () =>
      prisma.visit.findMany({
        where: {
          doctorId: doctor.id,
          visitStatus: {
            in: ["WAITING", "IN_CONSULTATION"],
          },
        },
        include: {
          patient: { select: { id: true, name: true, bloodGroup: true } },
          vitals: true,
        },
        orderBy: [{ visitStatus: "asc" }, { createdAt: "asc" }],
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

  const patient = await getPatientProfileForUser(patientUserId);

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
