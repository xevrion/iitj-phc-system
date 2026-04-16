import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  listAvailableDoctors,
  getDoctorProfile,
  setAvailability,
  checkInDoctor,
  checkOutDoctor,
  getAttendanceRecords,
  getMyAttendanceRecords,
  markPhysicianUnavailable,
} from "../services/doctor.service.js";

export const listDoctors = asyncHandler(async (req, res) => {
  const doctors = await listAvailableDoctors();
  return res.status(200).json(new ApiResponse(200, doctors, "Doctors fetched"));
});

export const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await getDoctorProfile(req.params.id);
  return res.status(200).json(new ApiResponse(200, doctor, "Doctor fetched"));
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const doctor = await setAvailability(req.user.id, req.body.isAvailable);
  return res
    .status(200)
    .json(new ApiResponse(200, doctor, "Availability updated"));
});

export const checkIn = asyncHandler(async (req, res) => {
  const attendance = await checkInDoctor(req.user.id);
  return res.status(200).json(new ApiResponse(200, attendance, "Checked in"));
});

export const checkOut = asyncHandler(async (req, res) => {
  const attendance = await checkOutDoctor(req.user.id);
  return res.status(200).json(new ApiResponse(200, attendance, "Checked out"));
});

export const attendance = asyncHandler(async (req, res) => {
  const records = await getAttendanceRecords(req.query.doctorId);
  return res
    .status(200)
    .json(new ApiResponse(200, records, "Attendance records fetched"));
});

export const myAttendance = asyncHandler(async (req, res) => {
  const records = await getMyAttendanceRecords(req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, records, "Your attendance records fetched"));
});

export const markUnavailable = asyncHandler(async (req, res) => {
  const result = await markPhysicianUnavailable(req.user.id, req.params.id, req.body);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Physician marked unavailable"));
});
