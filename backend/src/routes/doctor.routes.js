import { Router } from "express";
import {
  listDoctors,
  getDoctor,
  updateAvailability,
  checkIn,
  checkOut,
  attendance,
} from "../controllers/doctor.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// REQ-43: all authenticated users can see available doctors
router.get("/", listDoctors);
router.get("/:id", getDoctor);

// REQ-20: doctor updates their own availability
router.put("/me/availability", authorizeRoles("DOCTOR"), updateAvailability);

// REQ-35, REQ-36, REQ-37: specialist check-in/check-out for attendance tracking
router.post("/me/checkin", authorizeRoles("DOCTOR"), checkIn);
router.post("/me/checkout", authorizeRoles("DOCTOR"), checkOut);

// REQ-50: admin views attendance records
router.get("/attendance/records", authorizeRoles("ADMIN"), attendance);

export default router;
