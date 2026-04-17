import { Router } from "express";
import {
  create,
  getByVisit,
  pending,
  history,
  dispense,
} from "../controllers/prescription.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

// Nested under /api/v1/visits/:visitId/prescription
const visitPrescriptionRouter = Router({ mergeParams: true });
visitPrescriptionRouter.use(verifyJWT);

visitPrescriptionRouter.post("/", authorizeRoles("DOCTOR"), create);
visitPrescriptionRouter.get(
  "/",
  authorizeRoles("DOCTOR", "PHARMACY_STAFF", "PATIENT", "ADMIN"),
  getByVisit
);

// Top-level /api/v1/prescriptions for pharmacy operations
const prescriptionRouter = Router();
prescriptionRouter.use(verifyJWT);

prescriptionRouter.get("/pending", authorizeRoles("PHARMACY_STAFF", "ADMIN"), pending);
prescriptionRouter.get("/history", authorizeRoles("PHARMACY_STAFF", "ADMIN"), history);
prescriptionRouter.put("/:id/dispense", authorizeRoles("PHARMACY_STAFF"), dispense);

export { visitPrescriptionRouter, prescriptionRouter };
