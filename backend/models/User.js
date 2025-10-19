import mongoose from "mongoose";

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
    password: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
