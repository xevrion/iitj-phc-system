import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadDocument, listDocuments, deleteDocument } from "../services/document.service.js";

export const upload = asyncHandler(async (req, res) => {
  const doc = await uploadDocument(req.params.id, req.user, req.body, req.file);
  return res.status(201).json(new ApiResponse(201, doc, "Document uploaded"));
});

export const list = asyncHandler(async (req, res) => {
  const docs = await listDocuments(req.params.id, req.user);
  return res.status(200).json(new ApiResponse(200, docs, "Documents fetched"));
});

export const remove = asyncHandler(async (req, res) => {
  await deleteDocument(req.params.id, req.params.docId, req.user);
  return res.status(200).json(new ApiResponse(200, null, "Document deleted"));
});
