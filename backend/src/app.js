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

// Health check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// TODO: Mount routes here
// import authRoutes from "./routes/auth.routes.js";
// app.use("/api/v1/auth", authRoutes);

export { app };
