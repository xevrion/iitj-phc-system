import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { cache } from "../utils/cache.js";

const MEDICINE_LIST_CACHE_KEY = "medicine:list";
const MEDICINE_CACHE_TTL_MS = 30 * 1000;

// REQ-47: list medicines in inventory
export const listMedicines = async () => {
  return cache.getOrSet(MEDICINE_LIST_CACHE_KEY, MEDICINE_CACHE_TTL_MS, () =>
    prisma.medicine.findMany({
      orderBy: { name: "asc" },
    })
  );
};

export const getMedicineById = async (id) => {
  const medicine = await prisma.medicine.findUnique({ where: { id } });
  if (!medicine) throw new ApiError(404, "Medicine not found");
  return medicine;
};

// ADMIN adds new medicine to inventory
export const addMedicine = async ({ name, stockQuantity, unitPrice }) => {
  if (!name || stockQuantity == null || unitPrice == null)
    throw new ApiError(400, "name, stockQuantity, and unitPrice are required");
  if (stockQuantity < 0) throw new ApiError(400, "stockQuantity must be >= 0");
  if (unitPrice <= 0) throw new ApiError(400, "unitPrice must be > 0");

  const medicine = await prisma.medicine.create({
    data: { name, stockQuantity: Number(stockQuantity), unitPrice },
  });

  cache.del(MEDICINE_LIST_CACHE_KEY);
  return medicine;
};

// PHARMACY_STAFF or ADMIN updates stock quantity
export const updateMedicineStock = async (id, { stockQuantity }) => {
  if (stockQuantity == null) throw new ApiError(400, "stockQuantity is required");
  if (stockQuantity < 0) throw new ApiError(400, "stockQuantity must be >= 0");

  const existingMedicine = await prisma.medicine.findUnique({ where: { id } });
  if (!existingMedicine) throw new ApiError(404, "Medicine not found");

  const medicine = await prisma.medicine.update({
    where: { id },
    data: { stockQuantity: Number(stockQuantity) },
  });

  cache.del(MEDICINE_LIST_CACHE_KEY);
  return medicine;
};
