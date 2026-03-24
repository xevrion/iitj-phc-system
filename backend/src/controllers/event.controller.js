import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { publishPHCEvent, listUpcomingPHCEvents } from "../services/event.service.js";

export const publish = asyncHandler(async (req, res) => {
  const event = await publishPHCEvent(req.user.id, req.body);
  return res.status(201).json(new ApiResponse(201, event, "PHC event published"));
});

export const listUpcoming = asyncHandler(async (req, res) => {
  const events = await listUpcomingPHCEvents();
  return res.status(200).json(new ApiResponse(200, events, "Upcoming PHC events fetched"));
});
