import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    title: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

const Reminder = mongoose.model("Reminder", reminderSchema);

export default Reminder;
