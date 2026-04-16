import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const VALID_DOCUMENT_TYPES = ["PRESCRIPTION", "LAB_REPORT", "DISCHARGE"];

const assertDocumentAccess = async (patientId, requester) => {
  if (requester.role !== "PATIENT") {
    return;
  }

  const patient = await prisma.patient.findUnique({
    where: { userId: requester.id },
    select: { id: true },
  });

  if (!patient) {
    throw new ApiError(404, "Patient profile not found");
  }

  if (patient.id !== patientId) {
    throw new ApiError(403, "Access denied");
  }
};

// Upload external document for a patient (optionally tied to a visit)
export const uploadDocument = async (
  patientId,
  requester,
  { documentType, fileUrl, visitId }
) => {
  await assertDocumentAccess(patientId, requester);

  if (!documentType || !fileUrl)
    throw new ApiError(400, "documentType and fileUrl are required");

  if (!VALID_DOCUMENT_TYPES.includes(documentType))
    throw new ApiError(400, `documentType must be one of: ${VALID_DOCUMENT_TYPES.join(", ")}`);

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new ApiError(404, "Patient not found");

  if (visitId) {
    const visit = await prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) throw new ApiError(404, "Visit not found");
    if (visit.patientId !== patientId)
      throw new ApiError(400, "Visit does not belong to this patient");
  }

  return prisma.externalDocument.create({
    data: {
      patientId,
      documentType,
      fileUrl,
      visitId: visitId ?? null,
    },
  });
};

export const deleteDocument = async (patientId, documentId, requester) => {
  await assertDocumentAccess(patientId, requester);

  const doc = await prisma.externalDocument.findUnique({ where: { id: documentId } });
  if (!doc) throw new ApiError(404, "Document not found");
  if (doc.patientId !== patientId) throw new ApiError(403, "Access denied");

  await prisma.externalDocument.delete({ where: { id: documentId } });
};

export const listDocuments = async (patientId, requester) => {
  await assertDocumentAccess(patientId, requester);

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new ApiError(404, "Patient not found");

  return prisma.externalDocument.findMany({
    where: { patientId },
    orderBy: { uploadedAt: "desc" },
  });
};
