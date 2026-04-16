import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

export const getMyNotifications = async (userId, since) => {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          doctorType: true,
          specialization: true,
        },
      },
      appointment: {
        select: {
          id: true,
          appointmentTime: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const markNotificationRead = async (userId, notificationId) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { id: true, userId: true, readAt: true },
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (notification.userId !== userId) {
    throw new ApiError(403, "Access denied");
  }

  if (notification.readAt) {
    return prisma.notification.findUnique({
      where: { id: notificationId },
    });
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
};
