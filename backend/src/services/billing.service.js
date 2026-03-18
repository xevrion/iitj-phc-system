import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

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

  return bill;
};

export const getBillByVisit = async (visitId) => {
  const bill = await prisma.bill.findUnique({
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
  });
  if (!bill) throw new ApiError(404, "Bill not found for this visit");
  return bill;
};

export const markBillPaid = async (billId) => {
  const bill = await prisma.bill.findUnique({ where: { id: billId } });
  if (!bill) throw new ApiError(404, "Bill not found");
  if (bill.paymentStatus === "PAID") throw new ApiError(400, "Bill is already paid");

  return prisma.bill.update({
    where: { id: billId },
    data: { paymentStatus: "PAID" },
  });
};

export const getUnpaidBills = async () => {
  return prisma.bill.findMany({
    where: { paymentStatus: "UNPAID" },
    include: {
      visit: {
        select: {
          id: true,
          visitType: true,
          patient: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
};
