import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

// REQ-43: real-time doctor availability for patient and staff dashboards
export const listAvailableDoctors = async () => {
  return prisma.doctor.findMany({
    where: { isAvailable: true },
    select: {
      id: true,
      name: true,
      doctorType: true,
      specialization: true,
      isAvailable: true,
    },
  });
};

export const getDoctorProfile = async (doctorId) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: {
      id: true,
      name: true,
      doctorType: true,
      specialization: true,
      isAvailable: true,
    },
  });
  if (!doctor) throw new ApiError(404, "Doctor not found");
  return doctor;
};

// REQ-20: doctor sets availability status manually
export const setAvailability = async (userId, isAvailable) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  return prisma.doctor.update({
    where: { userId },
    data: { isAvailable },
  });
};

// REQ-35, REQ-36: specialist checks in — marks available, opens attendance record
export const checkInDoctor = async (userId) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  const openRecord = await prisma.doctorAttendance.findFirst({
    where: { doctorId: doctor.id, checkOut: null },
  });
  if (openRecord) throw new ApiError(400, "Already checked in");

  const [attendance] = await prisma.$transaction([
    prisma.doctorAttendance.create({
      data: { doctorId: doctor.id, checkIn: new Date() },
    }),
    prisma.doctor.update({
      where: { id: doctor.id },
      data: { isAvailable: true },
    }),
  ]);

  return attendance;
};

// REQ-36, REQ-37, REQ-38: check out — marks unavailable, computes total hours
export const checkOutDoctor = async (userId) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  const openRecord = await prisma.doctorAttendance.findFirst({
    where: { doctorId: doctor.id, checkOut: null },
  });
  if (!openRecord) throw new ApiError(400, "No active check-in found");

  const checkOut = new Date();
  const totalHours = parseFloat(
    ((checkOut - openRecord.checkIn) / (1000 * 60 * 60)).toFixed(2)
  );

  const [attendance] = await prisma.$transaction([
    prisma.doctorAttendance.update({
      where: { id: openRecord.id },
      data: { checkOut, totalHours },
    }),
    prisma.doctor.update({
      where: { id: doctor.id },
      data: { isAvailable: false },
    }),
  ]);

  return attendance;
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
