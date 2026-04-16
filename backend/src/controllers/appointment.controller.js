import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  listAppointments,
  getDoctorAppointments,
  bookAppointment,
  bookAppointmentAsStaff,
  getMyAppointmentsAsPatient,
  getMyAppointmentsAsDoctor,
  cancelAppointment,
} from "../services/appointment.service.js";

export const list = asyncHandler(async (req, res) => {
  const appointments = await listAppointments({ doctorId: req.query.doctorId });
  return res.status(200).json(new ApiResponse(200, appointments, "Appointments fetched"));
});

export const listForDoctor = asyncHandler(async (req, res) => {
  const appointments = await getDoctorAppointments(req.params.id);
  return res.status(200).json(new ApiResponse(200, appointments, "Appointments fetched"));
});

export const book = asyncHandler(async (req, res) => {
  let appointment;
  if (req.user.role === "PATIENT") {
    appointment = await bookAppointment(req.user.id, req.body);
  } else {
    // RECEPTION_STAFF books on behalf of patient — patientId required in body
    appointment = await bookAppointmentAsStaff(req.body);
  }
  return res.status(201).json(new ApiResponse(201, appointment, "Appointment booked"));
});

export const myAppointmentsPatient = asyncHandler(async (req, res) => {
  const appointments = await getMyAppointmentsAsPatient(req.user.id);
  return res.status(200).json(new ApiResponse(200, appointments, "Your appointments"));
});

export const myAppointmentsDoctor = asyncHandler(async (req, res) => {
  const appointments = await getMyAppointmentsAsDoctor(req.user.id);
  return res.status(200).json(new ApiResponse(200, appointments, "Your appointments"));
});

export const cancel = asyncHandler(async (req, res) => {
  const appointment = await cancelAppointment(req.params.id);
  return res.status(200).json(new ApiResponse(200, appointment, "Appointment cancelled"));
});
