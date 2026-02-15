import mongoose from "mongoose";

const hackathonSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    title: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    platform: {
        type: String,
    },
    link: {
        type: String,
    },
    status: {
        type: String,
        enum: ["Pending", "Completed"],
        default: "Pending",
    },
}, {
    timestamps: true,
});

const Hackathon = mongoose.model("Hackathon", hackathonSchema);

export default Hackathon;
