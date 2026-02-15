import express from "express";
import { addReminder, getReminders, deleteReminder } from "../controllers/taskControllers.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/add", protect, addReminder);
router.get("/list", protect, getReminders);
router.delete("/:id", protect, deleteReminder);

export default router;
