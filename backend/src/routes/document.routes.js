import { Router } from "express";
import { upload, list } from "../controllers/document.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

// Nested under /api/v1/patients/:id/documents
const router = Router({ mergeParams: true });
router.use(verifyJWT);

const allowedRoles = ["DOCTOR", "RECEPTION_STAFF", "PATIENT", "ADMIN"];

router.post("/", authorizeRoles(...allowedRoles), upload);
router.get("/", authorizeRoles(...allowedRoles), list);

export default router;
