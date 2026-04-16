import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getUsageReport,
  getAttendanceSummaryReport,
} from "../services/report.service.js";
import { cache } from "../utils/cache.js";

const TTL_5MIN = 5 * 60 * 1000;

export const usage = asyncHandler(async (req, res) => {
  let report = cache.get("report:usage");
  if (!report) {
    report = await getUsageReport();
    cache.set("report:usage", report, TTL_5MIN);
  }
  return res.status(200).json(new ApiResponse(200, report, "Usage report fetched"));
});

export const attendanceSummary = asyncHandler(async (req, res) => {
  let report = cache.get("report:attendance");
  if (!report) {
    report = await getAttendanceSummaryReport();
    cache.set("report:attendance", report, TTL_5MIN);
  }
  return res.status(200).json(new ApiResponse(200, report, "Attendance summary report fetched"));
});
