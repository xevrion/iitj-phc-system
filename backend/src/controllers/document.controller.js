import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadDocument, listDocuments } from "../services/document.service.js";

export const upload = asyncHandler(async (req, res) => {
  const doc = await uploadDocument(req.params.id, req.body);
  return res.status(201).json(new ApiResponse(201, doc, "Document uploaded"));
});

export const list = asyncHandler(async (req, res) => {
  const docs = await listDocuments(req.params.id);
  return res.status(200).json(new ApiResponse(200, docs, "Documents fetched"));
});
