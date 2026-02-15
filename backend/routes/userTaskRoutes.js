import express from "express";
import User from "../models/User.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get all tasks (assignments, hackathons, reminders)
router.get("/", protect, async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.json({
            success: true,
            assignments: user.assignments || [],
            hackathons: user.hackathons || [],
            reminders: user.reminders || [],
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Add assignment
router.post("/assignment", protect, async (req, res) => {
    try {
        const { title, deadline } = req.body;
        const user = req.user;
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.assignments.push({ title, deadline });
        await user.save();
        res.json({ success: true, assignments: user.assignments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Add hackathon
router.post("/hackathon", protect, async (req, res) => {
    try {
        const { title, date, platform, link } = req.body;
        const user = req.user;
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.hackathons.push({ title, date, platform, link });
        await user.save();
        res.json({ success: true, hackathons: user.hackathons });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Add reminder
router.post("/reminder", protect, async (req, res) => {
    try {
        const { title, time } = req.body;
        const user = req.user;
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.reminders.push({ title, time });
        await user.save();
        res.json({ success: true, reminders: user.reminders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Toggle status (assignment or hackathon)
router.patch("/:type/:id/status", protect, async (req, res) => {
    try {
        const { type, id } = req.params;
        const user = req.user;
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        let collection;
        if (type === "assignment") collection = user.assignments;
        else if (type === "hackathon") collection = user.hackathons;
        else return res.status(400).json({ success: false, message: "Invalid task type" });

        const task = collection.id(id);
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });

        task.status = task.status === "Pending" ? "Completed" : "Pending";
        await user.save();
        res.json({ success: true, [type + "s"]: collection });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete task
router.delete("/:type/:id", protect, async (req, res) => {
    try {
        const { type, id } = req.params;
        const user = req.user;
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (type === "assignment") {
            user.assignments.pull(id);
        } else if (type === "hackathon") {
            user.hackathons.pull(id);
        } else if (type === "reminder") {
            user.reminders.pull(id);
        } else {
            return res.status(400).json({ success: false, message: "Invalid task type" });
        }

        await user.save();
        res.json({ success: true, message: "Task deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
