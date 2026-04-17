import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { cache } from "../utils/cache.js";

const UPCOMING_EVENTS_CACHE_KEY = "event:list:upcoming";
const EVENT_CACHE_TTL_MS = 60 * 1000;

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

  const event = await prisma.pHCEvent.create({
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

  cache.del(UPCOMING_EVENTS_CACHE_KEY);
  return event;
};

export const listUpcomingPHCEvents = async () => {
  return cache.getOrSet(UPCOMING_EVENTS_CACHE_KEY, EVENT_CACHE_TTL_MS, () =>
    prisma.pHCEvent.findMany({
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
    })
  );
};
