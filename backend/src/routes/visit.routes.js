import { Router } from "express";
import {
  create,
  getById,
  addVitals,
  claim,
  saveNotes,
  complete,
  cancel,
  myQueue,
  myCurrent,
} from "../controllers/visit.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// REQ-17: reception staff registers a visit
router.post("/", authorizeRoles("RECEPTION_STAFF", "ADMIN"), create);

// REQ-21: doctor's waiting queue
router.get("/my-queue", authorizeRoles("DOCTOR"), myQueue);

// Patient sees current active visit and queue status
router.get("/my-current", authorizeRoles("PATIENT"), myCurrent);

// View full visit record
router.get(
  "/:id",
  authorizeRoles("DOCTOR", "ADMIN", "RECEPTION_STAFF", "PHARMACY_STAFF", "LAB_STAFF"),
  getById
);

// REQ-16: reception records vitals at check-in
router.post("/:id/vitals", authorizeRoles("RECEPTION_STAFF", "ADMIN"), addVitals);

// REQ-22: doctor claims a visit
router.put("/:id/claim", authorizeRoles("DOCTOR"), claim);

// REQ-24: doctor saves consultation notes
router.put("/:id/consultation", authorizeRoles("DOCTOR"), saveNotes);

// Doctor marks visit complete
router.put("/:id/complete", authorizeRoles("DOCTOR"), complete);

// Cancel a visit
router.put("/:id/cancel", authorizeRoles("RECEPTION_STAFF", "ADMIN", "DOCTOR"), cancel);

export default router;
