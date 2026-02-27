import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

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
export const getLabRequestsByVisit = async (visitId) => {
  return prisma.labRequest.findMany({
    where: { visitId },
    include: { report: true },
    orderBy: { id: "asc" },
  });
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
export const uploadLabReport = async (labRequestId, labStaffUserId, { reportUrl }) => {
  if (!reportUrl?.trim()) throw new ApiError(400, "Report URL is required");

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

  const [, report] = await prisma.$transaction([
    prisma.labRequest.update({
      where: { id: labRequestId },
      data: { status: "COMPLETED" },
    }),
    prisma.labReport.create({
      data: {
        labRequestId,
        uploadedByLabStaffId: labStaff.id,
        reportUrl: reportUrl.trim(),
      },
    }),
  ]);

  return report;
};
