import test from "node:test";
import assert from "node:assert/strict";

import prisma from "../../src/db/index.js";
import { getPatientVisitHistory } from "../../src/services/patient.service.js";
import { createVisit, claimVisit } from "../../src/services/visit.service.js";
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

test("getPatientVisitHistory blocks one patient from reading another patient's visits", async () => {
  mockMethod("patient.findUnique", async ({ where }) => {
    if (where.userId) {
      return { id: "patient-owner" };
    }

    return { id: "patient-target" };
  });

  await assert.rejects(
    () =>
      getPatientVisitHistory("patient-target", {
        id: "user-1",
        role: "PATIENT",
      }),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 403 &&
      error.message === "Access denied"
  );
});

test("getPatientVisitHistory applies limit when requester is allowed", async () => {
  mockMethod("patient.findUnique", async () => ({ id: "patient-1" }));
  mockMethod("visit.findMany", async (query) => [
    { id: "visit-1", query },
  ]);

  const result = await getPatientVisitHistory(
    "patient-1",
    { id: "doctor-user", role: "DOCTOR" },
    5
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].query.take, 5);
});

test("createVisit rejects unavailable assigned doctor", async () => {
  mockMethod("patient.findUnique", async () => ({ id: "patient-1" }));
  mockMethod("doctor.findUnique", async () => ({
    id: "doctor-1",
    isAvailable: false,
  }));

  await assert.rejects(
    () =>
      createVisit({
        patientId: "patient-1",
        doctorId: "doctor-1",
        visitType: "OPD",
      }),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 400 &&
      error.message === "Selected doctor is currently unavailable"
  );
});

test("createVisit builds waiting visit with nested vitals", async () => {
  mockMethod("patient.findUnique", async () => ({ id: "patient-1" }));
  mockMethod("visit.create", async ({ data }) => ({
    id: "visit-1",
    ...data,
  }));

  const result = await createVisit({
    patientId: "patient-1",
    visitType: "OPD",
    vitals: {
      weight: 67.5,
      temperature: 98.7,
      bloodPressure: "118/76",
    },
  });

  assert.equal(result.visitStatus, "WAITING");
  assert.equal(result.vitals.create.weight, 67.5);
});

test("claimVisit rejects visits that are not waiting", async () => {
  mockMethod("visit.findUnique", async () => ({
    id: "visit-1",
    visitStatus: "IN_CONSULTATION",
  }));

  await assert.rejects(
    () => claimVisit("visit-1", "doctor-user"),
    (error) =>
      error instanceof ApiError &&
      error.statusCode === 400 &&
      error.message === "Only WAITING visits can be claimed"
  );
});
