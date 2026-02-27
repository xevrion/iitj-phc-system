import { Router } from "express";
import {
  create,
  getByVisit,
  pending,
  uploadReport,
} from "../controllers/lab.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

// Nested under /api/v1/visits/:visitId/lab-requests
const visitLabRouter = Router({ mergeParams: true });
visitLabRouter.use(verifyJWT);

visitLabRouter.post("/", authorizeRoles("DOCTOR"), create);
visitLabRouter.get(
  "/",
  authorizeRoles("DOCTOR", "PATIENT", "LAB_STAFF", "ADMIN"),
  getByVisit
);

// Top-level /api/v1/lab-requests for lab staff operations
const labRouter = Router();
labRouter.use(verifyJWT);

labRouter.get("/pending", authorizeRoles("LAB_STAFF", "ADMIN"), pending);
labRouter.post("/:id/report", authorizeRoles("LAB_STAFF"), uploadReport);

export { visitLabRouter, labRouter };
