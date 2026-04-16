import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getMyNotifications,
  markNotificationRead,
} from "../services/notification.service.js";

export const listMine = asyncHandler(async (req, res) => {
  const notifications = await getMyNotifications(req.user.id, req.query.since);
  return res
    .status(200)
    .json(new ApiResponse(200, notifications, "Notifications fetched"));
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await markNotificationRead(req.user.id, req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});
