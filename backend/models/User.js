



import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    videoId: String,
    url: String,
    watchedAt: { type: Date, default: Date.now },
    secondsWatched: { type: Number, default: 0 },
    tabSwitches: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    className: { type: String },
    course: { type: String },
    year: { type: String },
    domain: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    college: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    nation: { type: String, required: true },
    password: { type: String, required: true },

    // --- Video Tracker Fields ---
    coins: { type: Number, default: 50 },
    videosWatched: { type: Number, default: 0 },
    videosSwitched: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastDayWatched: { type: Date, default: null },

    // --- NEW FIELD: 5-Day History ---
    history: [historySchema],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

