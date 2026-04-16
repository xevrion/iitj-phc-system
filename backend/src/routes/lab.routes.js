import { Router } from "express";
import multer from "multer";
import {
  create,
  getById,
  getByVisit,
  pending,
  uploadReport,
} from "../controllers/lab.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

// Nested under /api/v1/visits/:visitId/lab-requests
const visitLabRouter = Router({ mergeParams: true });
visitLabRouter.use(verifyJWT);

visitLabRouter.post("/", authorizeRoles("DOCTOR"), create);
visitLabRouter.get(
  "/",
  authorizeRoles("DOCTOR", "PATIENT", "LAB_STAFF", "ADMIN"),
  getByVisit
);

// Top-level /api/v1/lab-requests for lab staff operations
const labRouter = Router();
labRouter.use(verifyJWT);

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const allowedMimeTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(new Error("Only PDF, PNG, and JPG files are allowed"));
      return;
    }

    callback(null, true);
  },
});

labRouter.get("/pending", authorizeRoles("LAB_STAFF", "ADMIN"), pending);
labRouter.get("/:id", authorizeRoles("DOCTOR", "PATIENT", "LAB_STAFF", "ADMIN"), getById);
labRouter.post(
  "/:id/report",
  authorizeRoles("LAB_STAFF"),
  uploadMiddleware.single("file"),
  uploadReport
);

export { visitLabRouter, labRouter };
