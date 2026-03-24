import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getUsageReport,
  getAttendanceSummaryReport,
} from "../services/report.service.js";

export const usage = asyncHandler(async (req, res) => {
  const report = await getUsageReport();
  return res.status(200).json(new ApiResponse(200, report, "Usage report fetched"));
});

export const attendanceSummary = asyncHandler(async (req, res) => {
  const report = await getAttendanceSummaryReport();
  return res
    .status(200)
    .json(new ApiResponse(200, report, "Attendance summary report fetched"));
});
