import { Router } from "express";
import { listUpcoming } from "../controllers/event.controller.js";

const router = Router();

router.get("/", listUpcoming);

export default router;
