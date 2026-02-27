import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parsers
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Static files
app.use(express.static("public"));

// root route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the IITJ PHC System API" });
});

// Import routes
import healthcheckRoutes from "./routes/healthcheck.routes.js";
import authRoutes from "./routes/auth.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import visitRoutes from "./routes/visit.routes.js";

// Import error handler
import { errorHandler } from "./middlewares/errorHandler.middleware.js";

// Mount routes
app.use("/api/v1/healthcheck", healthcheckRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/patients", patientRoutes);
app.use("/api/v1/visits", visitRoutes);

// Global error handler — must be last
app.use(errorHandler);

export { app };
