import test from "node:test";
import assert from "node:assert/strict";

import prisma from "../../src/db/index.js";
import {
  bookAppointment,
  cancelAppointment,
  getMyAppointmentsAsPatient,
} from "../../src/services/appointment.service.js";
import { setAvailability, checkInDoctor } from "../../src/services/doctor.service.js";
import { addMedicine, updateMedicineStock } from "../../src/services/medicine.service.js";
import { markNotificationRead } from "../../src/services/notification.service.js";
import { ApiError } from "../../src/utils/ApiError.js";

const originals = new Map();

const mockMethod = (path, implementation) => {
  const [scope, method] = path.split(".");

  if (!originals.has(path)) {
    originals.set(path, prisma[scope][method]);
  }

  prisma[scope][method] = implementation;
};

const restoreMocks = () => {
  for (const [path, original] of originals.entries()) {
    const [scope, method] = path.split(".");
    prisma[scope][method] = original;
  }
  originals.clear();
};

test.afterEach(() => {
  restoreMocks();
});

test("bookAppointment rejects unavailable doctor when not emergency", async () => {
  mockMethod("doctor.findUnique", async () => ({
    id: "doctor-1",
    isAvailable: false,
  }));

  await assert.rejects(
    () =>
      bookAppointment("user-1", {
        doctorId: "doctor-1",
        appointmentTime: "2099-01-01T10:00:00.000Z",
        slotDuration: 15,
      }),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 400 &&
      error.message.includes("Doctor is currently unavailable")
  );
});

test("bookAppointment creates appointment for valid future slot", async () => {
  mockMethod("doctor.findUnique", async () => ({
    id: "doctor-1",
    isAvailable: true,
  }));
  mockMethod("patient.findUnique", async () => ({
    id: "patient-1",
  }));
  mockMethod("appointment.create", async ({ data }) => ({
    id: "appointment-1",
    ...data,
  }));

  const result = await bookAppointment("user-1", {
    doctorId: "doctor-1",
    appointmentTime: "2099-01-01T10:00:00.000Z",
    slotDuration: 15,
  });

  assert.equal(result.patientId, "patient-1");
  assert.equal(result.doctorId, "doctor-1");
  assert.equal(result.slotDuration, 15);
});

test("getMyAppointmentsAsPatient throws when patient profile is missing", async () => {
  mockMethod("patient.findUnique", async () => null);

  await assert.rejects(
    () => getMyAppointmentsAsPatient("user-404"),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 404 &&
      error.message === "Patient profile not found"
  );
});

test("cancelAppointment rejects an already cancelled appointment", async () => {
  mockMethod("appointment.findUnique", async () => ({
    id: "appointment-1",
    status: "CANCELLED",
  }));

  await assert.rejects(
    () => cancelAppointment("appointment-1"),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 400 &&
      error.message === "Appointment is already cancelled"
  );
});

test("setAvailability requires an open attendance record before opening consultations", async () => {
  mockMethod("doctor.findUnique", async () => ({
    id: "doctor-1",
    userId: "user-1",
    name: "Dr. Sharma",
    doctorType: "PHYSICIAN",
    specialization: null,
    isAvailable: false,
  }));
  mockMethod("doctorAttendance.findFirst", async () => null);

  await assert.rejects(
    () => setAvailability("user-1", true),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 400 &&
      error.message === "Check in first before opening consultations"
  );
});

test("checkInDoctor rejects duplicate open attendance", async () => {
  mockMethod("doctor.findUnique", async () => ({
    id: "doctor-1",
    userId: "user-1",
    name: "Dr. Sharma",
    doctorType: "PHYSICIAN",
    specialization: null,
    isAvailable: false,
  }));
  mockMethod("doctorAttendance.findFirst", async () => ({
    id: "attendance-1",
    doctorId: "doctor-1",
    checkOut: null,
  }));

  await assert.rejects(
    () => checkInDoctor("user-1"),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 400 &&
      error.message === "Already checked in"
  );
});

test("addMedicine validates stock and unit price", async () => {
  await assert.rejects(
    () => addMedicine({ name: "Test", stockQuantity: -1, unitPrice: 10 }),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 400 &&
      error.message === "stockQuantity must be >= 0"
  );

  await assert.rejects(
    () => addMedicine({ name: "Test", stockQuantity: 10, unitPrice: 0 }),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 400 &&
      error.message === "unitPrice must be > 0"
  );
});

test("updateMedicineStock rejects unknown medicine ids", async () => {
  mockMethod("medicine.findUnique", async () => null);

  await assert.rejects(
    () => updateMedicineStock("medicine-404", { stockQuantity: 5 }),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 404 &&
      error.message === "Medicine not found"
  );
});

test("markNotificationRead rejects access to another user's notification", async () => {
  mockMethod("notification.findUnique", async () => ({
    id: "notification-1",
    userId: "other-user",
    readAt: null,
  }));

  await assert.rejects(
    () => markNotificationRead("current-user", "notification-1"),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 403 &&
      error.message === "Access denied"
  );
});
