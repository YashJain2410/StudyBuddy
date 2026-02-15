import Assignment from "../models/Assignment.js";
import Hackathon from "../models/Hackathon.js";
import Reminder from "../models/Reminder.js";
import User from "../models/User.js";

// --- ASSIGNMENTS ---
export const addAssignment = async (req, res) => {
    try {
        console.log("🔥 ADD ASSIGNMENT HIT");
        console.log("BODY:", req.body);
        const { title, description, deadline } = req.body;
        const assignment = await Assignment.create({ userId: req.user.id, title, description, deadline });

        // Also push to User document's assignments array
        await User.findByIdAndUpdate(req.user.id, {
            $push: { assignments: { title, deadline, status: "Pending" } }
        });

        res.status(201).json({ success: true, assignment });
    } catch (error) {
        console.error("❌ ASSIGNMENT SAVE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({ userId: req.user.id }).sort("-createdAt");
        res.json({ success: true, assignments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleAssignmentStatus = async (req, res) => {
    try {
        const assignment = await Assignment.findOne({ _id: req.params.id, userId: req.user.id });
        if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
        assignment.status = assignment.status === "Pending" ? "Completed" : "Pending";
        await assignment.save();
        res.json({ success: true, assignment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
        res.json({ success: true, message: "Assignment deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- HACKATHONS ---
export const addHackathon = async (req, res) => {
    try {
        console.log("🔥 ADD HACKATHON HIT");
        console.log("BODY:", req.body);
        const { title, date, platform, link } = req.body;
        const hackathon = await Hackathon.create({ userId: req.user.id, title, date, platform, link });

        // Also push to User document's hackathons array
        await User.findByIdAndUpdate(req.user.id, {
            $push: { hackathons: { title, date, platform, link, status: "Pending" } }
        });

        res.status(201).json({ success: true, hackathon });
    } catch (error) {
        console.error("❌ HACKATHON SAVE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getHackathons = async (req, res) => {
    try {
        const hackathons = await Hackathon.find({ userId: req.user.id }).sort("-createdAt");
        res.json({ success: true, hackathons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleHackathonStatus = async (req, res) => {
    try {
        const hackathon = await Hackathon.findOne({ _id: req.params.id, userId: req.user.id });
        if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
        hackathon.status = hackathon.status === "Pending" ? "Completed" : "Pending";
        await hackathon.save();
        res.json({ success: true, hackathon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteHackathon = async (req, res) => {
    try {
        const hackathon = await Hackathon.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
        res.json({ success: true, message: "Hackathon deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- REMINDERS ---
export const addReminder = async (req, res) => {
    try {
        console.log("🔥 ADD REMINDER HIT");
        console.log("BODY:", req.body);
        const { title, time } = req.body;
        const reminder = await Reminder.create({ userId: req.user.id, title, time });

        // Also push to User document's reminders array
        await User.findByIdAndUpdate(req.user.id, {
            $push: { reminders: { title, time } }
        });

        res.status(201).json({ success: true, reminder });
    } catch (error) {
        console.error("❌ REMINDER SAVE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getReminders = async (req, res) => {
    try {
        const reminders = await Reminder.find({ userId: req.user.id }).sort("-createdAt");
        res.json({ success: true, reminders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteReminder = async (req, res) => {
    try {
        const reminderId = req.params.id;
        const userId = req.user.id;

        // 1. Delete from dedicated Reminder collection
        const reminder = await Reminder.findOneAndDelete({ _id: reminderId, userId: userId });

        // 2. Also pull from User document's reminders array (for redundancy/legacy support)
        await User.findByIdAndUpdate(userId, {
            $pull: { reminders: { _id: reminderId } }
        });

        // Some legacy reminders might not have _id in the array but just 'id' or title? 
        // But usually, they have _id if they are subdocs. Let's stick to _id.

        if (!reminder) {
            // Check if it exists in the user array even if not in the collection
            const user = await User.findById(userId);
            if (user && user.reminders.id(reminderId)) {
                user.reminders.pull(reminderId);
                await user.save();
                return res.json({ success: true, message: "Reminder deleted from user record" });
            }
            return res.status(404).json({ success: false, message: "Reminder not found" });
        }

        res.json({ success: true, message: "Reminder deleted" });
    } catch (error) {
        console.error("❌ DELETE REMINDER ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
