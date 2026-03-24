import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  createLabRequest,
  getLabRequestsByVisit,
  getPendingLabRequests,
  uploadLabReport,
} from "../services/lab.service.js";

export const create = asyncHandler(async (req, res) => {
  const request = await createLabRequest(req.params.visitId, req.user.id, req.body);
  return res
    .status(201)
    .json(new ApiResponse(201, request, "Lab request created"));
});

export const getByVisit = asyncHandler(async (req, res) => {
  const requests = await getLabRequestsByVisit(req.params.visitId, req.user);
  return res
    .status(200)
    .json(new ApiResponse(200, requests, "Lab requests fetched"));
});

export const pending = asyncHandler(async (req, res) => {
  const requests = await getPendingLabRequests();
  return res
    .status(200)
    .json(new ApiResponse(200, requests, "Pending lab requests fetched"));
});

export const uploadReport = asyncHandler(async (req, res) => {
  const report = await uploadLabReport(req.params.id, req.user.id, req.body);
  return res.status(201).json(new ApiResponse(201, report, "Report uploaded"));
});
