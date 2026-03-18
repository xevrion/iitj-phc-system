import { Router } from "express";
import { checkIn } from "../controllers/checkin.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.post("/", authorizeRoles("RECEPTION_STAFF"), checkIn);

export default router;
