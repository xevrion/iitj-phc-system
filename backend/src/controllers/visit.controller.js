import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  createVisit,
  getVisit,
  upsertVitals,
  claimVisit,
  saveConsultationNotes,
  completeVisit,
  cancelVisit,
  getDoctorQueue,
} from "../services/visit.service.js";

export const create = asyncHandler(async (req, res) => {
  const { patientId, doctorId, visitType, vitals } = req.body;
  const visit = await createVisit({ patientId, doctorId, visitType, vitals });
  return res.status(201).json(new ApiResponse(201, visit, "Visit created"));
});

export const getById = asyncHandler(async (req, res) => {
  const visit = await getVisit(req.params.id);
  return res.status(200).json(new ApiResponse(200, visit, "Visit fetched"));
});

export const addVitals = asyncHandler(async (req, res) => {
  const vitals = await upsertVitals(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, vitals, "Vitals recorded"));
});

export const claim = asyncHandler(async (req, res) => {
  const visit = await claimVisit(req.params.id, req.user.id);
  return res.status(200).json(new ApiResponse(200, visit, "Visit claimed"));
});

export const saveNotes = asyncHandler(async (req, res) => {
  const visit = await saveConsultationNotes(
    req.params.id,
    req.body.consultationNotes,
    req.user.id
  );
  return res
    .status(200)
    .json(new ApiResponse(200, visit, "Consultation notes saved"));
});

export const complete = asyncHandler(async (req, res) => {
  const visit = await completeVisit(req.params.id, req.user.id);
  return res.status(200).json(new ApiResponse(200, visit, "Visit completed"));
});

export const cancel = asyncHandler(async (req, res) => {
  const visit = await cancelVisit(req.params.id);
  return res.status(200).json(new ApiResponse(200, visit, "Visit cancelled"));
});

export const myQueue = asyncHandler(async (req, res) => {
  const queue = await getDoctorQueue(req.user.id);
  return res.status(200).json(new ApiResponse(200, queue, "Queue fetched"));
});
