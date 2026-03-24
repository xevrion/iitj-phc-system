import { Router } from "express";
import { publish } from "../controllers/event.controller.js";
import { usage, attendanceSummary } from "../controllers/report.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/events", authorizeRoles("ADMIN"), publish);
router.get("/reports/usage", authorizeRoles("ADMIN"), usage);
router.get("/reports/attendance", authorizeRoles("ADMIN"), attendanceSummary);

export default router;
