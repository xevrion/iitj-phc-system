import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFromCloudinary, uploadBufferToCloudinary } from "../utils/cloudinary.js";

const VALID_DOCUMENT_TYPES = ["PRESCRIPTION", "LAB_REPORT", "DISCHARGE"];

const parseCloudinaryMetadataFromUrl = (fileUrl) => {
  if (!fileUrl?.includes("/upload/")) {
    return null;
  }

  const uploadMarker = "/upload/";
  const uploadIndex = fileUrl.indexOf(uploadMarker);
  const prefix = fileUrl.slice(0, uploadIndex);
  const suffix = fileUrl.slice(uploadIndex + uploadMarker.length);

  const resourceTypeMatch = prefix.match(/\/(image|video|raw)$/);
  const resourceType = resourceTypeMatch?.[1] || "image";
  const pathSegments = suffix.split("/").filter(Boolean);

  if (pathSegments.length === 0) {
    return null;
  }

  const versionIndex = pathSegments.findIndex((segment) => /^v\d+$/.test(segment));
  const publicIdSegments =
    versionIndex >= 0 ? pathSegments.slice(versionIndex + 1) : pathSegments;

  if (publicIdSegments.length === 0) {
    return null;
  }

  const lastSegment = publicIdSegments[publicIdSegments.length - 1];
  const lastDotIndex = lastSegment.lastIndexOf(".");
  const normalizedLastSegment =
    lastDotIndex > 0 ? lastSegment.slice(0, lastDotIndex) : lastSegment;

  publicIdSegments[publicIdSegments.length - 1] = normalizedLastSegment;

  return {
    resourceType,
    publicId: publicIdSegments.join("/"),
  };
};

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
  { documentType, fileUrl, visitId },
  file = null
) => {
  await assertDocumentAccess(patientId, requester);

  if (!documentType)
    throw new ApiError(400, "documentType is required");

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

  let resolvedFileUrl = fileUrl;

  if (file) {
    const uploadResult = await uploadBufferToCloudinary(file.buffer, {
      folder: process.env.CLOUDINARY_FOLDER || "iitj-phc-system/medical-documents",
      public_id: `${patientId}-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
    });

    resolvedFileUrl = uploadResult.secure_url;

    return prisma.externalDocument.create({
      data: {
        patientId,
        documentType,
        fileUrl: resolvedFileUrl,
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryResourceType: uploadResult.resource_type,
        originalFilename: file.originalname,
        visitId: visitId ?? null,
      },
    });
  }

  if (!resolvedFileUrl) {
    throw new ApiError(400, "A file upload or fileUrl is required");
  }

  return prisma.externalDocument.create({
    data: {
      patientId,
      documentType,
      fileUrl: resolvedFileUrl,
      originalFilename: resolvedFileUrl.split("/").pop() || null,
      visitId: visitId ?? null,
    },
  });
};

export const deleteDocument = async (patientId, documentId, requester) => {
  await assertDocumentAccess(patientId, requester);

  const doc = await prisma.externalDocument.findUnique({ where: { id: documentId } });
  if (!doc) throw new ApiError(404, "Document not found");
  if (doc.patientId !== patientId) throw new ApiError(403, "Access denied");

  const cloudinaryMetadata =
    doc.cloudinaryPublicId && doc.cloudinaryResourceType
      ? {
          publicId: doc.cloudinaryPublicId,
          resourceType: doc.cloudinaryResourceType,
        }
      : parseCloudinaryMetadataFromUrl(doc.fileUrl);

  if (cloudinaryMetadata?.publicId) {
    await deleteFromCloudinary(
      cloudinaryMetadata.publicId,
      cloudinaryMetadata.resourceType || "image"
    );
  }

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
