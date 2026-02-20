import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import trackingRoutes from "./routes/trackingRoutes.js";
import detectorRoutes from "./routes/detectorRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import userTaskRoutes from "./routes/userTaskRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import hackathonRoutes from "./routes/hackathonRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ===== ENV VARIABLES =====
const PORT = process.env.PORT || 6000;
const FRONTEND_URL = process.env.FRONTEND_URL;

// ===== CORS SETUP =====
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// ===== SOCKET.IO =====
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(cookieParser());

// ===== ROUTES =====
app.use("/api/auth", authRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/detector", detectorRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/user-tasks", userTaskRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/reminders", reminderRoutes);

// ===== STATIC UPLOADS =====
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ===== HEALTH ROUTE =====
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// ===== START SERVER =====
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected");

    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();