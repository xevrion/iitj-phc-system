const APPOINTMENT_QUEUE_TIME_ZONE = "Asia/Kolkata";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APPOINTMENT_QUEUE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const getDateKeyInQueueTimeZone = (value) => dateFormatter.format(new Date(value));

export const isSameAppointmentDay = (left, right = new Date()) =>
  getDateKeyInQueueTimeZone(left) === getDateKeyInQueueTimeZone(right);

export const isFutureAppointmentDay = (value, right = new Date()) =>
  getDateKeyInQueueTimeZone(value) > getDateKeyInQueueTimeZone(right);

export const isPastAppointmentDay = (value, right = new Date()) =>
  getDateKeyInQueueTimeZone(value) < getDateKeyInQueueTimeZone(right);

export const isTodayQueueAppointment = (appointment, now = new Date()) =>
  appointment.status === "BOOKED" && isSameAppointmentDay(appointment.appointmentTime, now);
