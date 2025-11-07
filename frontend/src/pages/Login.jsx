import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";

import { Link, useNavigate } from "react-router-dom";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setAppState } = useAppContext();


  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Relative API path, proxy handle karega
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include", // cookie support
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
     if (res.ok) {
     localStorage.setItem("user", JSON.stringify(data.user));

     if (data.token) localStorage.setItem("token", data.token);

       setAppState({ coins: data.user.coins, streak: data.user.streak || 0, name: data.user.name, email: data.user.email, });

     alert(`Welcome back, ${data.user.name}! Coins: ${data.user.coins}`);
     navigate("/"); 
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
      <div className="w-full max-w-md bg-white/40 backdrop-blur-lg shadow-2xl rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Login</h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label>Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-indigo-700 to-pink-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700">
          Don’t have an account?{" "}
          <Link to="/register" className="text-indigo-700 font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
