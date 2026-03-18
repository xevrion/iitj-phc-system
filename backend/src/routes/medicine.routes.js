import { Router } from "express";
import { list, getById, add, updateStock } from "../controllers/medicine.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.get("/", list);
router.get("/:id", getById);
router.post("/", authorizeRoles("ADMIN"), add);
router.put("/:id/stock", authorizeRoles("PHARMACY_STAFF", "ADMIN"), updateStock);

export default router;
