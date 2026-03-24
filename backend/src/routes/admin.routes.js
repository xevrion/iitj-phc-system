import { Router } from "express";
import { publish } from "../controllers/event.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/events", authorizeRoles("ADMIN"), publish);

export default router;
