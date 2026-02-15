import Assignment from "../models/Assignment.js";

export const addAssignment = async (req, res) => {
    try {
        console.log("🔥 ADD ASSIGNMENT HIT");
        console.log("BODY:", req.body);
        console.log("USER:", req.user);

        const { title, description, deadline } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required",
            });
        }

        const assignment = await Assignment.create({
            userId: req.user.id,
            title,
            description,
            deadline, // Mapping 'deadline' from frontend to 'deadline' in DB (corrected from dueDate)
        });

        res.status(201).json({
            success: true,
            assignment,
        });

    } catch (error) {
        console.error("❌ ASSIGNMENT SAVE ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
