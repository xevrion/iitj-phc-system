import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  listMedicines,
  getMedicineById,
  addMedicine,
  updateMedicineStock,
} from "../services/medicine.service.js";

export const list = asyncHandler(async (req, res) => {
  const medicines = await listMedicines();
  return res.status(200).json(new ApiResponse(200, medicines, "Medicines fetched"));
});

export const getById = asyncHandler(async (req, res) => {
  const medicine = await getMedicineById(req.params.id);
  return res.status(200).json(new ApiResponse(200, medicine, "Medicine fetched"));
});

export const add = asyncHandler(async (req, res) => {
  const medicine = await addMedicine(req.body);
  return res.status(201).json(new ApiResponse(201, medicine, "Medicine added"));
});

export const updateStock = asyncHandler(async (req, res) => {
  const medicine = await updateMedicineStock(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, medicine, "Stock updated"));
});
