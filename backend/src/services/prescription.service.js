import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { cache } from "../utils/cache.js";
import { getDoctorProfileForUser } from "./profile-cache.service.js";

const PRESCRIPTION_CACHE_PREFIX = "prescription:";
const PRESCRIPTION_CACHE_TTL_MS = 15 * 1000;

const invalidatePrescriptionCaches = (visitId = null, prescriptionId = null) => {
  cache.delPrefix(PRESCRIPTION_CACHE_PREFIX);

  if (visitId) {
    cache.del(`${PRESCRIPTION_CACHE_PREFIX}visit:${visitId}`);
  }

  if (prescriptionId) {
    cache.del(`${PRESCRIPTION_CACHE_PREFIX}id:${prescriptionId}`);
  }
};

// REQ-44, REQ-48: doctor creates prescription; rejects if incomplete
export const createPrescription = async (visitId, doctorUserId, { notes, items }) => {
  const doctor = await getDoctorProfileForUser(doctorUserId);

  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new ApiError(404, "Visit not found");
  if (visit.doctorId !== doctor.id)
    throw new ApiError(403, "You are not assigned to this visit");

  const existing = await prisma.prescription.findUnique({ where: { visitId } });
  if (existing)
    throw new ApiError(409, "A prescription already exists for this visit");

  if (!items || items.length === 0)
    throw new ApiError(400, "Prescription must include at least one medicine");

  // REQ-48: validate all medicines exist before accepting
  const medicineIds = items.map((i) => i.medicineId);
  const medicines = await prisma.medicine.findMany({
    where: { id: { in: medicineIds } },
  });
  if (medicines.length !== medicineIds.length)
    throw new ApiError(404, "One or more medicines not found in inventory");

  const prescription = await prisma.prescription.create({
    data: {
      visitId,
      doctorId: doctor.id,
      notes: notes ?? null,
      items: {
        create: items.map((item) => ({
          medicineId: item.medicineId,
          dosage: item.dosage ?? null,
          duration: item.duration ?? null,
        })),
      },
    },
    include: { items: { include: { medicine: true } } },
  });

  invalidatePrescriptionCaches(visitId, prescription.id);
  return prescription;
};

// REQ-45, REQ-46: pharmacy and patient can access prescription
export const getPrescriptionByVisit = async (visitId) => {
  const prescription = await cache.getOrSet(
    `${PRESCRIPTION_CACHE_PREFIX}visit:${visitId}`,
    PRESCRIPTION_CACHE_TTL_MS,
    () =>
      prisma.prescription.findUnique({
        where: { visitId },
        include: {
          items: { include: { medicine: true } },
          doctor: { select: { name: true, specialization: true } },
          visit: {
            select: {
              id: true,
              createdAt: true,
              patient: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })
  );
  if (!prescription) throw new ApiError(404, "Prescription not found");
  return prescription;
};

// Pharmacy views undispensed prescriptions queue
export const getPendingPrescriptions = async () => {
  return cache.getOrSet(`${PRESCRIPTION_CACHE_PREFIX}pending`, PRESCRIPTION_CACHE_TTL_MS, () =>
    prisma.prescription.findMany({
      where: { isDispensed: false },
      include: {
        items: { include: { medicine: true } },
        visit: {
          select: {
            id: true,
            visitType: true,
            createdAt: true,
            patient: { select: { id: true, name: true } },
            bill: {
              select: {
                id: true,
                totalAmount: true,
                paymentStatus: true,
                createdAt: true,
                items: {
                  include: {
                    medicine: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        doctor: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  );
};

export const getDispensedPrescriptions = async () => {
  return cache.getOrSet(`${PRESCRIPTION_CACHE_PREFIX}dispensed`, PRESCRIPTION_CACHE_TTL_MS, () =>
    prisma.prescription.findMany({
      where: { isDispensed: true },
      include: {
        items: { include: { medicine: true } },
        visit: {
          select: {
            id: true,
            visitType: true,
            createdAt: true,
            patient: { select: { id: true, name: true } },
            bill: {
              select: {
                id: true,
                totalAmount: true,
                paymentStatus: true,
                createdAt: true,
              },
            },
          },
        },
        doctor: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  );
};

// REQ-46: pharmacy staff marks prescription as dispensed after handing out medicines
export const dispensePrescription = async (prescriptionId) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      visit: {
        include: {
          bill: true,
        },
      },
    },
  });
  if (!prescription) throw new ApiError(404, "Prescription not found");
  if (prescription.isDispensed) throw new ApiError(400, "Already dispensed");
  if (!prescription.visit?.bill) {
    throw new ApiError(400, "Generate the bill before dispensing medicines");
  }
  if (prescription.visit.bill.paymentStatus !== "PAID") {
    throw new ApiError(400, "Collect payment before dispensing medicines");
  }

  const updatedPrescription = await prisma.prescription.update({
    where: { id: prescriptionId },
    data: { isDispensed: true },
  });

  invalidatePrescriptionCaches(prescription.visitId, prescriptionId);
  return updatedPrescription;
};
