


import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  title: String,
  deadline: Date,
  status: { type: String, enum: ["Pending", "Completed"], default: "Pending" }
});

const hackathonSchema = new mongoose.Schema({
  title: String,
  date: Date,
  platform: String,
  link: String,
  status: { type: String, enum: ["Pending", "Completed"], default: "Pending" }
});

const reminderSchema = new mongoose.Schema({
  title: String,
  time: String
}, { timestamps: true });

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
    lastDayWatched: { type: String, default: null },

    // --- Assignments, Hackathons, Reminders ---
    assignments: [assignmentSchema],
    hackathons: [hackathonSchema],
    reminders: [reminderSchema],

    // --- NEW FIELD: 5-Day History ---
    history: [
      {
        videoId: String,
        url: String,
        watchedAt: { type: Date, default: Date.now },
        secondsWatched: { type: Number, default: 0 },
        tabSwitches: { type: Number, default: 0 },
        note: { type: String, default: "" },
        tag: { type: String, default: "" },
      }
    ],
    // ✅ NEW FIELD: Persistent Notes
    // Key = videoId or filename, Value = note text
    notes: { type: Object, default: {} },
    tags: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
