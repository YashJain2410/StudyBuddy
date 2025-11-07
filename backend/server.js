import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
import { setupDetectionSocket } from "./routes/detectionRoutes.js"; // Import router and socket setup
import connectDB from "./config/db.js";
import trackingRoutes from "./routes/trackingRoutes.js";




dotenv.config();

const app = express();

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

// Connect DB and start server
const PORT = process.env.PORT || 6000;

const startServer = async () => {
  try {
    await connectDB(); // MongoDB connect
    console.log("✅ MongoDB Connected");

    // === ADD THIS LINE HERE ===
    // This activates the socket logic from your routes file.
    setupDetectionSocket(io);

    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();