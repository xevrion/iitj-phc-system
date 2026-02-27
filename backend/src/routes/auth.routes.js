import { Router } from "express";
import { login, getMe } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.get("/me", verifyJWT, getMe);

export default router;
