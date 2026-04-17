import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { cache } from "../utils/cache.js";
import { getPatientProfileForUser } from "./profile-cache.service.js";

const BILL_CACHE_PREFIX = "bill:";
const BILL_CACHE_TTL_MS = 15 * 1000;

const invalidateBillCaches = (visitId = null, billId = null, patientId = null) => {
  cache.delPrefix(BILL_CACHE_PREFIX);

  if (visitId) {
    cache.del(`${BILL_CACHE_PREFIX}visit:${visitId}`);
  }

  if (billId) {
    cache.del(`${BILL_CACHE_PREFIX}id:${billId}`);
  }

  if (patientId) {
    cache.del(`${BILL_CACHE_PREFIX}patient:${patientId}`);
  }
};

// REQ-49: pharmacy generates bill; atomically deducts stock
export const generateBill = async (visitId, { items }) => {
  if (!items || items.length === 0)
    throw new ApiError(400, "Bill must include at least one item");

  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new ApiError(404, "Visit not found");

  const existing = await prisma.bill.findUnique({ where: { visitId } });
  if (existing) throw new ApiError(409, "A bill already exists for this visit");

  // Fetch all medicines and validate stock
  const medicineIds = items.map((i) => i.medicineId);
  const medicines = await prisma.medicine.findMany({
    where: { id: { in: medicineIds } },
  });

  if (medicines.length !== medicineIds.length)
    throw new ApiError(404, "One or more medicines not found in inventory");

  const medicineMap = new Map(medicines.map((m) => [m.id, m]));

  let totalAmount = 0;
  const billItemsData = [];

  for (const item of items) {
    const medicine = medicineMap.get(item.medicineId);
    if (item.quantity <= 0) throw new ApiError(400, "Quantity must be > 0");
    if (medicine.stockQuantity < item.quantity)
      throw new ApiError(
        400,
        `Insufficient stock for ${medicine.name}: available ${medicine.stockQuantity}, requested ${item.quantity}`
      );

    const linePrice = Number(medicine.unitPrice) * item.quantity;
    totalAmount += linePrice;
    billItemsData.push({
      medicineId: item.medicineId,
      quantity: item.quantity,
      price: linePrice,
    });
  }

  // Atomic: create bill + decrement stock
  const [bill] = await prisma.$transaction([
    prisma.bill.create({
      data: {
        visitId,
        totalAmount,
        items: { create: billItemsData },
      },
      include: {
        items: { include: { medicine: { select: { name: true } } } },
      },
    }),
    ...items.map((item) =>
      prisma.medicine.update({
        where: { id: item.medicineId },
        data: { stockQuantity: { decrement: item.quantity } },
      })
    ),
  ]);

  invalidateBillCaches(visitId, bill.id, visit.patientId);
  return bill;
};

export const getBillByVisit = async (visitId) => {
  const bill = await cache.getOrSet(
    `${BILL_CACHE_PREFIX}visit:${visitId}`,
    BILL_CACHE_TTL_MS,
    () =>
      prisma.bill.findUnique({
        where: { visitId },
        include: {
          items: {
            include: {
              medicine: { select: { id: true, name: true, unitPrice: true } },
            },
          },
          visit: {
            select: {
              id: true,
              visitType: true,
              patient: { select: { id: true, name: true } },
            },
          },
        },
      })
  );
  if (!bill) throw new ApiError(404, "Bill not found for this visit");
  return bill;
};

export const markBillPaid = async (billId) => {
  const bill = await prisma.bill.findUnique({ where: { id: billId } });
  if (!bill) throw new ApiError(404, "Bill not found");
  if (bill.paymentStatus === "PAID") throw new ApiError(400, "Bill is already paid");

  const updatedBill = await prisma.bill.update({
    where: { id: billId },
    data: { paymentStatus: "PAID" },
  });

  invalidateBillCaches(bill.visitId, billId);
  return updatedBill;
};

export const getMyBills = async (userId) => {
  const patient = await getPatientProfileForUser(userId);

  return cache.getOrSet(`${BILL_CACHE_PREFIX}patient:${patient.id}`, BILL_CACHE_TTL_MS, () =>
    prisma.bill.findMany({
      where: { visit: { patientId: patient.id } },
      include: {
        items: { include: { medicine: { select: { id: true, name: true, unitPrice: true } } } },
        visit: {
          select: {
            id: true,
            visitType: true,
            createdAt: true,
            doctor: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  );
};

export const getUnpaidBills = async () => {
  return cache.getOrSet(`${BILL_CACHE_PREFIX}unpaid`, BILL_CACHE_TTL_MS, () =>
    prisma.bill.findMany({
      where: { paymentStatus: "UNPAID" },
      include: {
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                unitPrice: true,
              },
            },
          },
        },
        visit: {
          select: {
            id: true,
            visitType: true,
            createdAt: true,
            doctor: { select: { name: true } },
            patient: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  );
};
