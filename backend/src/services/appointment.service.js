import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const parseAppointmentDate = (appointmentTime) => {
  const parsedDate = new Date(appointmentTime);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new ApiError(400, "appointmentTime must be a valid date-time");
  }

  if (parsedDate.getTime() <= Date.now()) {
    throw new ApiError(400, "Appointment time must be in the future");
  }

  return parsedDate;
};

export const listAppointments = async ({ doctorId } = {}) => {
  if (doctorId) {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new ApiError(404, "Doctor not found");
  }

  return prisma.appointment.findMany({
    where: doctorId ? { doctorId } : undefined,
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          specialization: true,
          doctorType: true,
        },
      },
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
    orderBy: { appointmentTime: "asc" },
  });
};

// List appointments for a specific doctor (any authenticated user)
export const getDoctorAppointments = async (doctorId) => {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new ApiError(404, "Doctor not found");

  return prisma.appointment.findMany({
    where: { doctorId },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { appointmentTime: "asc" },
  });
};

// REQ-32: book appointment — reject if doctor unavailable unless emergency
export const bookAppointment = async (
  patientUserId,
  { doctorId, appointmentTime, slotDuration, isEmergency = false }
) => {
  if (!doctorId || !appointmentTime || !slotDuration)
    throw new ApiError(400, "doctorId, appointmentTime, and slotDuration are required");

  const parsedAppointmentTime = parseAppointmentDate(appointmentTime);

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new ApiError(404, "Doctor not found");

  if (!doctor.isAvailable && !isEmergency)
    throw new ApiError(
      400,
      "Doctor is currently unavailable. Set isEmergency: true to override."
    );

  const patient = await prisma.patient.findUnique({ where: { userId: patientUserId } });
  if (!patient) throw new ApiError(404, "Patient profile not found");

  return prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId,
      appointmentTime: parsedAppointmentTime,
      slotDuration: Number(slotDuration),
      isEmergency,
    },
    include: {
      doctor: { select: { id: true, name: true, specialization: true } },
      patient: { select: { id: true, name: true } },
    },
  });
};

// Also allow reception staff to book on behalf of a patient
export const bookAppointmentAsStaff = async (
  { doctorId, appointmentTime, slotDuration, isEmergency = false, patientId }
) => {
  if (!doctorId || !appointmentTime || !slotDuration || !patientId)
    throw new ApiError(400, "doctorId, patientId, appointmentTime, and slotDuration are required");

  const parsedAppointmentTime = parseAppointmentDate(appointmentTime);

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new ApiError(404, "Doctor not found");

  if (!doctor.isAvailable && !isEmergency)
    throw new ApiError(400, "Doctor is currently unavailable. Set isEmergency: true to override.");

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new ApiError(404, "Patient not found");

  return prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      appointmentTime: parsedAppointmentTime,
      slotDuration: Number(slotDuration),
      isEmergency,
    },
    include: {
      doctor: { select: { id: true, name: true, specialization: true } },
      patient: { select: { id: true, name: true } },
    },
  });
};

// Patient views own appointments
export const getMyAppointmentsAsPatient = async (userId) => {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) throw new ApiError(404, "Patient profile not found");

  return prisma.appointment.findMany({
    where: { patientId: patient.id },
    include: {
      doctor: { select: { id: true, name: true, specialization: true, doctorType: true } },
    },
    orderBy: { appointmentTime: "desc" },
  });
};

// Doctor views own appointments
export const getMyAppointmentsAsDoctor = async (userId) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  return prisma.appointment.findMany({
    where: { doctorId: doctor.id },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { appointmentTime: "asc" },
  });
};

export const cancelAppointment = async (appointmentId) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!appointment) throw new ApiError(404, "Appointment not found");
  if (appointment.status === "CANCELLED")
    throw new ApiError(400, "Appointment is already cancelled");

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
  });
};
