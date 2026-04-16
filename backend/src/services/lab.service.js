import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFromCloudinary, uploadBufferToCloudinary } from "../utils/cloudinary.js";

// REQ-26: doctor requests a lab test during consultation
export const createLabRequest = async (visitId, doctorUserId, { testName }) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new ApiError(404, "Visit not found");
  if (visit.doctorId !== doctor.id)
    throw new ApiError(403, "You are not assigned to this visit");

  if (!testName?.trim()) throw new ApiError(400, "Test name is required");

  return prisma.labRequest.create({
    data: { visitId, doctorId: doctor.id, testName: testName.trim() },
  });
};

// REQ-55: link lab reports to patient visit
export const getLabRequestsByVisit = async (visitId, requester) => {
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      patient: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!visit) {
    throw new ApiError(404, "Visit not found");
  }

  if (requester.role === "PATIENT" && visit.patient.userId !== requester.id) {
    throw new ApiError(403, "Access denied");
  }

  return prisma.labRequest.findMany({
    where: { visitId },
    include: { report: true },
    orderBy: { id: "asc" },
  });
};

export const getLabRequestById = async (labRequestId, requester) => {
  const request = await prisma.labRequest.findUnique({
    where: { id: labRequestId },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          specialization: true,
          userId: true,
        },
      },
      visit: {
        select: {
          id: true,
          visitType: true,
          visitStatus: true,
          patient: {
            select: {
              id: true,
              name: true,
              userId: true,
            },
          },
        },
      },
      report: {
        include: {
          uploadedByStaff: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!request) {
    throw new ApiError(404, "Lab request not found");
  }

  if (requester.role === "PATIENT" && request.visit.patient.userId !== requester.id) {
    throw new ApiError(403, "Access denied");
  }

  if (requester.role === "DOCTOR" && request.doctor.userId !== requester.id) {
    throw new ApiError(403, "Access denied");
  }

  const { doctor, visit, report, ...requestData } = request;

  return {
    ...requestData,
    doctor: {
      id: doctor.id,
      name: doctor.name,
      specialization: doctor.specialization,
    },
    visit: {
      ...visit,
      patient: {
        id: visit.patient.id,
        name: visit.patient.name,
      },
    },
    report: report
      ? {
          id: report.id,
          labRequestId: report.labRequestId,
          reportUrl: report.reportUrl,
          uploadedAt: report.uploadedAt,
          uploadedByStaffId: report.uploadedByStaff?.id ?? null,
        }
      : null,
  };
};

// REQ-54: lab staff views all pending (REQUESTED) test orders
export const getPendingLabRequests = async () => {
  return prisma.labRequest.findMany({
    where: { status: "REQUESTED" },
    include: {
      visit: {
        select: {
          id: true,
          visitType: true,
          patient: { select: { id: true, name: true } },
        },
      },
      doctor: { select: { name: true } },
    },
    orderBy: { id: "asc" },
  });
};

// REQ-54, REQ-55: lab staff uploads report; audit trail via uploadedByLabStaffId
export const uploadLabReport = async (labRequestId, labStaffUserId, file = null) => {
  const labStaff = await prisma.labStaff.findUnique({
    where: { userId: labStaffUserId },
  });
  if (!labStaff) throw new ApiError(404, "Lab staff profile not found");

  const request = await prisma.labRequest.findUnique({
    where: { id: labRequestId },
  });
  if (!request) throw new ApiError(404, "Lab request not found");
  if (request.status === "COMPLETED")
    throw new ApiError(400, "Report has already been uploaded for this request");

  if (!file) {
    throw new ApiError(400, "A report file is required");
  }

  let uploadResult;

  try {
    uploadResult = await uploadBufferToCloudinary(file.buffer, {
      folder: process.env.CLOUDINARY_FOLDER || "iitj-phc-system/medical-documents",
      public_id: `lab-report-${labRequestId}-${Date.now()}-${file.originalname.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      )}`,
      resource_type: "auto",
    });

    const [, report] = await prisma.$transaction([
      prisma.labRequest.update({
        where: { id: labRequestId },
        data: { status: "COMPLETED" },
      }),
      prisma.labReport.create({
        data: {
          labRequestId,
          uploadedByLabStaffId: labStaff.id,
          reportUrl: uploadResult.secure_url,
        },
      }),
    ]);

    return report;
  } catch (error) {
    if (uploadResult?.public_id) {
      await deleteFromCloudinary(
        uploadResult.public_id,
        uploadResult.resource_type || "image"
      ).catch(() => null);
    }

    throw error;
  }
};
