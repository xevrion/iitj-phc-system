import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { cache } from "../utils/cache.js";
import { invalidateNotificationCache } from "./notification.service.js";
import { invalidateDoctorProfileCacheForUser } from "./profile-cache.service.js";
import { releaseWaitingVisitsForDoctor } from "./visit.service.js";

const DOCTOR_LIST_CACHE_KEY = "doctor:list:available";
const DOCTOR_PROFILE_CACHE_PREFIX = "doctor:profile:";
const DOCTOR_CACHE_TTL_MS = 30 * 1000;

const getDoctorOrThrow = async (where) => {
  const doctor = await prisma.doctor.findUnique({
    where,
    select: {
      id: true,
      userId: true,
      name: true,
      doctorType: true,
      specialization: true,
      isAvailable: true,
    },
  });

  if (!doctor) throw new ApiError(404, "Doctor profile not found");
  return doctor;
};

const buildSpecialistUnavailableMessage = (doctor, appointmentTime) => {
  const when = new Date(appointmentTime).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  return `${doctor.name || "The specialist"} is unavailable for your appointment on ${when}. Please book another slot or contact the PHC.`;
};

const createSpecialistUnavailableNotifications = async (tx, doctor) => {
  const appointments = await tx.appointment.findMany({
    where: {
      doctorId: doctor.id,
      status: "BOOKED",
      appointmentTime: { gte: new Date() },
    },
    include: {
      patient: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!appointments.length) {
    return { affectedAppointments: 0, notificationsCreated: 0 };
  }

  await tx.appointment.updateMany({
    where: {
      id: { in: appointments.map((appointment) => appointment.id) },
    },
    data: { status: "CANCELLED" },
  });

  await tx.notification.createMany({
    data: appointments.map((appointment) => ({
      userId: appointment.patient.userId,
      doctorId: doctor.id,
      appointmentId: appointment.id,
      title: "Specialist unavailable",
      message: buildSpecialistUnavailableMessage(doctor, appointment.appointmentTime),
      notificationType: "SPECIALIST_UNAVAILABLE",
    })),
  });

  appointments.forEach((appointment) => {
    invalidateNotificationCache(appointment.patient.userId);
  });

  return {
    affectedAppointments: appointments.length,
    notificationsCreated: appointments.length,
  };
};

const createPhysicianBroadcastNotifications = async (tx, doctor, reason = null) => {
  const users = await tx.user.findMany({
    where: {
      isActive: true,
      id: { not: doctor.userId },
    },
    select: { id: true },
  });

  if (!users.length) {
    return { notificationsCreated: 0 };
  }

  const reasonSuffix = reason ? ` Reason: ${reason}.` : "";

  await tx.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      doctorId: doctor.id,
      title: "Physician unavailable",
      message: `${doctor.name || "A physician"} has been marked unavailable.${reasonSuffix}`,
      notificationType: "PHYSICIAN_UNAVAILABLE",
    })),
  });

  users.forEach((user) => {
    invalidateNotificationCache(user.id);
  });

  return { notificationsCreated: users.length };
};

const setDoctorAvailabilityState = async (tx, doctor, isAvailable, notificationReason = null) => {
  let notificationSummary = {
    affectedAppointments: 0,
    notificationsCreated: 0,
    releasedWaitingVisits: 0,
  };

  if (doctor.isAvailable !== isAvailable && !isAvailable) {
    const releasedWaitingVisits = await releaseWaitingVisitsForDoctor(
      tx,
      doctor.id
    );

    if (doctor.doctorType === "SPECIALIST") {
      notificationSummary = await createSpecialistUnavailableNotifications(tx, doctor);
    } else {
      notificationSummary = await createPhysicianBroadcastNotifications(
        tx,
        doctor,
        notificationReason
      );
    }

    notificationSummary = {
      ...notificationSummary,
      releasedWaitingVisits,
    };
  }

  const updatedDoctor = await tx.doctor.update({
    where: { id: doctor.id },
    data: { isAvailable },
  });

  cache.del(DOCTOR_LIST_CACHE_KEY);
  cache.del(`${DOCTOR_PROFILE_CACHE_PREFIX}${doctor.id}`);
  invalidateDoctorProfileCacheForUser(doctor.userId);

  return { doctor: updatedDoctor, notificationSummary };
};

// REQ-43: real-time doctor availability for patient and staff dashboards
export const listAvailableDoctors = async () => {
  return cache.getOrSet(DOCTOR_LIST_CACHE_KEY, DOCTOR_CACHE_TTL_MS, () =>
    prisma.doctor.findMany({
      where: { isAvailable: true },
      select: {
        id: true,
        name: true,
        doctorType: true,
        specialization: true,
        isAvailable: true,
      },
    })
  );
};

export const getDoctorProfile = async (doctorId) => {
  const doctor = await cache.getOrSet(
    `${DOCTOR_PROFILE_CACHE_PREFIX}${doctorId}`,
    DOCTOR_CACHE_TTL_MS,
    () =>
      prisma.doctor.findUnique({
        where: { id: doctorId },
        select: {
          id: true,
          name: true,
          doctorType: true,
          specialization: true,
          isAvailable: true,
        },
      })
  );
  if (!doctor) throw new ApiError(404, "Doctor not found");
  return doctor;
};

// REQ-20: doctor sets availability status manually
export const setAvailability = async (userId, isAvailable) => {
  if (typeof isAvailable !== "boolean") {
    throw new ApiError(400, "isAvailable must be a boolean");
  }

  const doctor = await getDoctorOrThrow({ userId });
  const openRecord = await prisma.doctorAttendance.findFirst({
    where: { doctorId: doctor.id, checkOut: null },
  });

  if (isAvailable && !openRecord) {
    throw new ApiError(400, "Check in first before opening consultations");
  }

  return prisma.$transaction(async (tx) => {
    return setDoctorAvailabilityState(tx, doctor, isAvailable);
  });
};

// REQ-35, REQ-36: specialist checks in — opens attendance record for the day
export const checkInDoctor = async (userId) => {
  const doctor = await getDoctorOrThrow({ userId });

  const openRecord = await prisma.doctorAttendance.findFirst({
    where: { doctorId: doctor.id, checkOut: null },
  });
  if (openRecord) throw new ApiError(400, "Already checked in");

  return prisma.doctorAttendance.create({
    data: { doctorId: doctor.id, checkIn: new Date() },
  });
};

// REQ-36, REQ-37, REQ-38: check out — ends attendance and marks unavailable
export const checkOutDoctor = async (userId) => {
  const doctor = await getDoctorOrThrow({ userId });

  const openRecord = await prisma.doctorAttendance.findFirst({
    where: { doctorId: doctor.id, checkOut: null },
  });
  if (!openRecord) throw new ApiError(400, "No active check-in found");

  const checkOut = new Date();
  const totalHours = parseFloat(
    ((checkOut - openRecord.checkIn) / (1000 * 60 * 60)).toFixed(2)
  );

  return prisma.$transaction(async (tx) => {
    const attendance = await tx.doctorAttendance.update({
      where: { id: openRecord.id },
      data: { checkOut, totalHours },
    });

    const { notificationSummary } = await setDoctorAvailabilityState(
      tx,
      doctor,
      false
    );

    return {
      ...attendance,
      notificationSummary,
    };
  });
};

// REQ-50: admin views attendance records
export const getAttendanceRecords = async (doctorId) => {
  return prisma.doctorAttendance.findMany({
    where: doctorId ? { doctorId } : undefined,
    include: {
      doctor: { select: { name: true, doctorType: true } },
    },
    orderBy: { checkIn: "desc" },
  });
};

export const getMyAttendanceRecords = async (userId) => {
  const doctor = await getDoctorOrThrow({ userId });

  return prisma.doctorAttendance.findMany({
    where: { doctorId: doctor.id },
    orderBy: { checkIn: "desc" },
  });
};

export const markPhysicianUnavailable = async (
  actorUserId,
  doctorId,
  { reason = null } = {}
) => {
  const actor = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { id: true, role: true },
  });
  if (!actor) {
    throw new ApiError(404, "User not found");
  }

  const doctor = await getDoctorOrThrow({ id: doctorId });

  if (doctor.doctorType !== "PHYSICIAN") {
    throw new ApiError(400, "Only physicians can be marked unavailable via absence form");
  }

  return prisma.$transaction(async (tx) => {
    const { doctor: updatedDoctor, notificationSummary } =
      await setDoctorAvailabilityState(tx, doctor, false, reason?.trim() || null);

    return {
      doctor: updatedDoctor,
      markedByUserId: actor.id,
      reason: reason?.trim() || null,
      notificationSummary,
    };
  });
};
