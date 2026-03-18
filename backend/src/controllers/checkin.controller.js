import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { qrCheckIn } from "../services/checkin.service.js";

export const checkIn = asyncHandler(async (req, res) => {
  const visit = await qrCheckIn(req.body);
  return res.status(201).json(new ApiResponse(201, visit, "Patient checked in, visit created"));
});
