import { Router } from "express";
import { listMine, markRead } from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/mine", listMine);
router.put("/:id/read", markRead);

export default router;
