import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes.js";

import connectDB from "./config/db.js";
import trackingRoutes from "./routes/trackingRoutes.js";
import detectorRoutes from "./routes/detectorRoutes.js";
import path from "path";
import reportRoutes from "./routes/reportRoutes.js";
import userTaskRoutes from "./routes/userTaskRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import hackathonRoutes from "./routes/hackathonRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import { fileURLToPath } from "url";







dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const httpServer = createServer(app); // Create an HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // frontend ka port (vite)
    credentials: true,
  })
);
app.use("/api/tracking", trackingRoutes);

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/detector", detectorRoutes);
// app.use("/api/detector", detectorControlRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/user-tasks", userTaskRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/reminders", reminderRoutes);

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

// Connect DB and start server
const PORT = process.env.PORT || 6000;

const startServer = async () => {
  try {
    await connectDB(); // MongoDB connect
    console.log("✅ MongoDB Connected");

    // === ADD THIS LINE HERE ===
    // This activates the socket logic from your routes file.


    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();