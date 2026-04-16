import { Router } from "express";
import multer from "multer";
import { upload, list, remove } from "../controllers/document.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

// Nested under /api/v1/patients/:id/documents
const router = Router({ mergeParams: true });
router.use(verifyJWT);

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

const allowedRoles = ["DOCTOR", "RECEPTION_STAFF", "PATIENT", "ADMIN"];

router.post("/", authorizeRoles(...allowedRoles), uploadMiddleware.single("file"), upload);
router.get("/", authorizeRoles(...allowedRoles), list);
router.delete("/:docId", authorizeRoles(...allowedRoles), remove);

export default router;
