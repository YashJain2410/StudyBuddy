import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext"; // ✅ import context

const API = import.meta.env.VITE_API_URL;
import { apiFetch } from "../utils/api";


const Register = () => {
  const navigate = useNavigate();
  const { setAppState } = useAppContext(); // ✅ context updater
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    className: "",
    course: "",
    year: "",
    domain: "",
    email: "",
    phone: "",
    college: "",
    city: "",
    state: "",
    nation: "",
    password: "",
  });

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSignup = async (e) => {
  e.preventDefault();
  try {
    const res = await apiFetch(`${API}/api/auth/signup`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("user", JSON.stringify(data.user));

      setAppState({ coins: data.user.coins || 50, streak: data.user.streak || 0, name: data.user.name, email: data.user.email, });
      
      // 🎉 Welcome bonus alert
      if (data.user.coins === 500) {
        alert("Welcome! You’ve received 500 bonus coins 🎊");
      } else {
        alert("Register Successful");
      }

      navigate("/"); // redirect to home or dashboard
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-200 to-pink-100 px-6">
      <div className="w-full max-w-2xl bg-white/40 backdrop-blur-lg shadow-2xl rounded-2xl p-10">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8">Sign Up</h2>

        <form onSubmit={handleSignup} className="grid md:grid-cols-2 gap-6">
          {/* Inputs */}
          {[
            { label: "Full Name", name: "name", type: "text", required: true },
            { label: "Class", name: "className", type: "text" },
            { label: "Course", name: "course", type: "text" },
            { label: "Year", name: "year", type: "text" },
            { label: "Domain", name: "domain", type: "text" },
            { label: "Email", name: "email", type: "email", required: true },
            { label: "Phone No.", name: "phone", type: "tel", required: true },
            { label: "College/School", name: "college", type: "text", required: true },
            { label: "City", name: "city", type: "text", required: true },
            { label: "State", name: "state", type: "text", required: true },
            { label: "Nation", name: "nation", type: "text", required: true },
            { label: "Password", name: "password", type: "password", required: true },
          ].map((field, idx) => (
            <div key={idx}>
              <label className="block text-sm font-medium text-gray-700">
                {field.label}{field.required ? " *" : ""}
              </label>
              <input
                type={field.type}
                name={field.name}
                required={field.required || false}
                value={formData[field.name]}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full mt-8 py-3 bg-gradient-to-r from-indigo-700 to-pink-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-700 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
