import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  getPatient,
  getPatientByQR,
  getVisitHistory,
  getMyLabReportsList,
} from "../controllers/patient.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Patient views/updates own profile (REQ-12)
router.get("/me", authorizeRoles("PATIENT"), getMyProfile);
router.put("/me", authorizeRoles("PATIENT"), updateMyProfile);
router.get("/me/lab-reports", authorizeRoles("PATIENT"), getMyLabReportsList);

// QR-based identification at reception desk (REQ-15)
router.get(
  "/qr/:qrCode",
  authorizeRoles("RECEPTION_STAFF", "ADMIN"),
  getPatientByQR
);

// Doctor/admin/reception views a patient record (REQ-11)
router.get("/:id", authorizeRoles("DOCTOR", "ADMIN", "RECEPTION_STAFF"), getPatient);

// Patient visit history (REQ-10, REQ-23)
router.get(
  "/:id/visits",
  authorizeRoles("DOCTOR", "ADMIN", "RECEPTION_STAFF", "PATIENT"),
  getVisitHistory
);

export default router;
