import express from "express";
import { addHackathon, getHackathons, toggleHackathonStatus, deleteHackathon } from "../controllers/taskControllers.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/add", protect, addHackathon);
router.get("/list", protect, getHackathons);
router.patch("/:id/status", protect, toggleHackathonStatus);
router.delete("/:id", protect, deleteHackathon);

export default router;
