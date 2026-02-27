import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getPatientByUserId,
  getPatientById,
  getPatientByQrCode,
  updatePatientProfile,
  getPatientVisitHistory,
} from "../services/patient.service.js";

export const getMyProfile = asyncHandler(async (req, res) => {
  const patient = await getPatientByUserId(req.user.id);
  return res.status(200).json(new ApiResponse(200, patient, "Profile fetched"));
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const patient = await updatePatientProfile(req.user.id, req.body);
  return res.status(200).json(new ApiResponse(200, patient, "Profile updated"));
});

export const getPatient = asyncHandler(async (req, res) => {
  const patient = await getPatientById(req.params.id);
  return res.status(200).json(new ApiResponse(200, patient, "Patient fetched"));
});

export const getPatientByQR = asyncHandler(async (req, res) => {
  const patient = await getPatientByQrCode(req.params.qrCode);
  return res
    .status(200)
    .json(new ApiResponse(200, patient, "Patient identified via QR"));
});

export const getVisitHistory = asyncHandler(async (req, res) => {
  const visits = await getPatientVisitHistory(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, visits, "Visit history fetched"));
});
