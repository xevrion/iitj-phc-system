import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  createPrescription,
  getPrescriptionByVisit,
  getPendingPrescriptions,
  getDispensedPrescriptions,
  dispensePrescription,
} from "../services/prescription.service.js";

export const create = asyncHandler(async (req, res) => {
  const prescription = await createPrescription(
    req.params.visitId,
    req.user.id,
    req.body
  );
  return res
    .status(201)
    .json(new ApiResponse(201, prescription, "Prescription created"));
});

export const getByVisit = asyncHandler(async (req, res) => {
  const prescription = await getPrescriptionByVisit(req.params.visitId);
  return res
    .status(200)
    .json(new ApiResponse(200, prescription, "Prescription fetched"));
});

export const pending = asyncHandler(async (req, res) => {
  const prescriptions = await getPendingPrescriptions();
  return res
    .status(200)
    .json(new ApiResponse(200, prescriptions, "Pending prescriptions fetched"));
});

export const history = asyncHandler(async (_req, res) => {
  const prescriptions = await getDispensedPrescriptions();
  return res
    .status(200)
    .json(new ApiResponse(200, prescriptions, "Dispensed prescriptions fetched"));
});

export const dispense = asyncHandler(async (req, res) => {
  const prescription = await dispensePrescription(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, prescription, "Prescription marked as dispensed"));
});
