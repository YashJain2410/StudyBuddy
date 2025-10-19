import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-indigo-600 text-white px-6 py-3 flex justify-between items-center shadow">
      <h1 className="text-2xl font-bold">StudyBuddy</h1>
      <div className="space-x-4">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/dashboard" className="hover:underline">Dashboard</Link>
        <Link to="/videos" className="hover:underline">Videos</Link>
        <Link to="/reminders" className="hover:underline">Reminders</Link>
        <Link to="/login" className="hover:underline">Login</Link>
        <Link to="/register" className="hover:underline">Register</Link>
       
      </div>
    </nav>
  );
}
