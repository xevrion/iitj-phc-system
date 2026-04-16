import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  generateBill,
  getBillByVisit,
  markBillPaid,
  getUnpaidBills,
  getMyBills,
} from "../services/billing.service.js";

export const create = asyncHandler(async (req, res) => {
  const bill = await generateBill(req.params.visitId, req.body);
  return res.status(201).json(new ApiResponse(201, bill, "Bill generated"));
});

export const getByVisit = asyncHandler(async (req, res) => {
  const bill = await getBillByVisit(req.params.visitId);
  return res.status(200).json(new ApiResponse(200, bill, "Bill fetched"));
});

export const pay = asyncHandler(async (req, res) => {
  const bill = await markBillPaid(req.params.billId);
  return res.status(200).json(new ApiResponse(200, bill, "Bill marked as paid"));
});

export const unpaid = asyncHandler(async (req, res) => {
  const bills = await getUnpaidBills();
  return res.status(200).json(new ApiResponse(200, bills, "Unpaid bills fetched"));
});

export const mine = asyncHandler(async (req, res) => {
  const bills = await getMyBills(req.user.id);
  return res.status(200).json(new ApiResponse(200, bills, "My bills fetched"));
});
