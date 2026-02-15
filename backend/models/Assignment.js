import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    deadline: {
        type: Date,
    },
    status: {
        type: String,
        enum: ["Pending", "Completed"],
        default: "Pending",
    },
}, {
    timestamps: true,
});

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;
