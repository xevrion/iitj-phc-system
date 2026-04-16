import { Router } from "express";
import {
  list,
  listForDoctor,
  book,
  myAppointmentsPatient,
  myAppointmentsDoctor,
  cancel,
} from "../controllers/appointment.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

// /api/v1/appointments
router.get("/", authorizeRoles("RECEPTION_STAFF", "ADMIN"), list);
router.post("/", authorizeRoles("PATIENT", "RECEPTION_STAFF"), book);
router.get("/my", authorizeRoles("PATIENT"), myAppointmentsPatient);
router.put("/:id/cancel", authorizeRoles("PATIENT", "RECEPTION_STAFF", "ADMIN"), cancel);

export default router;

// Nested under /api/v1/doctors/:id/appointments and /api/v1/doctors/me/appointments
export const doctorAppointmentsRouter = Router({ mergeParams: true });
doctorAppointmentsRouter.use(verifyJWT);
doctorAppointmentsRouter.get(
  "/",
  authorizeRoles(
    "PATIENT",
    "DOCTOR",
    "RECEPTION_STAFF",
    "PHARMACY_STAFF",
    "LAB_STAFF",
    "ADMIN"
  ),
  listForDoctor
);

export const doctorMyAppointmentsRouter = Router();
doctorMyAppointmentsRouter.use(verifyJWT);
doctorMyAppointmentsRouter.get(
  "/",
  authorizeRoles("DOCTOR"),
  myAppointmentsDoctor
);
