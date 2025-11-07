// context/AppContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [appState, setAppState] = useState({
    user: JSON.parse(localStorage.getItem("user")) || null,
    coins: 0,
    streak: 0,
    history: [],
  });

  // 🪙 Fetch latest user coins + streak from backend (if logged in)
  useEffect(() => {
    const fetchUserCoins = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser?._id && !storedUser?.id) return; // user not logged in

      try {
        const res = await fetch(`/api/tracking/coins/${storedUser._id || storedUser.id}`);
        if (!res.ok) throw new Error("Failed to fetch coins");
        const data = await res.json();

        setAppState((prev) => ({
          ...prev,
          user: storedUser,
          coins: data.coins || prev.coins,
          streak: data.streak || prev.streak,
        }));

        // update localStorage coins
        localStorage.setItem("coins", data.coins || 0);
      } catch (err) {
        console.error("Coin fetch error:", err);
      }
    };

    fetchUserCoins();
  }, []);


  // 🕒 Fetch last 5 study sessions
  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("/api/tracking/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch history");
        const data = await res.json();

       setAppState((prev) => ({
  ...prev,
  history: data.history || [],
}));

      } catch (err) {
        console.error("History fetch error:", err);
      }
    };

    fetchHistory();
  }, []);


  return (
    <AppContext.Provider value={{ appState, setAppState }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
