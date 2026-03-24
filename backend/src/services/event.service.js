import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const getValidatedEventDate = (eventDate) => {
  if (!eventDate) {
    throw new ApiError(400, "eventDate is required");
  }

  const parsedEventDate = new Date(eventDate);

  if (Number.isNaN(parsedEventDate.getTime())) {
    throw new ApiError(400, "eventDate must be a valid date");
  }

  if (parsedEventDate < new Date()) {
    throw new ApiError(400, "eventDate must be in the future");
  }

  return parsedEventDate;
};

export const publishPHCEvent = async (publishedByUserId, { title, description, eventDate }) => {
  const trimmedTitle = title?.trim();

  if (!trimmedTitle) {
    throw new ApiError(400, "title is required");
  }

  const user = await prisma.user.findUnique({
    where: { id: publishedByUserId },
    select: { id: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return prisma.pHCEvent.create({
    data: {
      title: trimmedTitle,
      description: description?.trim() || null,
      eventDate: getValidatedEventDate(eventDate),
      publishedByUserId: user.id,
    },
    include: {
      publishedBy: {
        select: {
          id: true,
          ldapId: true,
          role: true,
        },
      },
    },
  });
};

export const listUpcomingPHCEvents = async () => {
  return prisma.pHCEvent.findMany({
    where: {
      eventDate: {
        gte: new Date(),
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      eventDate: true,
      publishedAt: true,
    },
    orderBy: { eventDate: "asc" },
  });
};
