// context/AppContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [appState, setAppState] = useState({
    user: JSON.parse(localStorage.getItem("user")) || null,
    coins: 0,
    streak: 0,
    history: [],
    notes: JSON.parse(localStorage.getItem("userNotes")) || {},
    tags: JSON.parse(localStorage.getItem("userTags")) || {},
    videosWatched: 0,   // ✅ new
    videosSwitched: 0,  // ✅ new
  });
  const userId = appState.user?.id || appState.user?._id;

  // --- Assignments, Hackathons, Reminders Global State ---
  const [assignments, setAssignments] = useState(() => {
    if (!userId) return [];
    const saved = localStorage.getItem(`assignments_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [hackathons, setHackathons] = useState(() => {
    if (!userId) return [];
    const saved = localStorage.getItem(`hackathons_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [reminders, setReminders] = useState(() => {
    if (!userId) return [];
    const saved = localStorage.getItem(`reminders_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [reminderTriggers, setReminderTriggers] = useState(() => {
    if (!userId) return {};
    const saved = localStorage.getItem(`reminderTriggers_${userId}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [highlightedReminders, setHighlightedReminders] = useState(() => {
    if (!userId) return new Set();
    const saved = localStorage.getItem(`reminderTriggers_${userId}`);
    if (!saved) return new Set();
    const triggers = JSON.parse(saved);
    const highlighted = new Set();
    Object.keys(triggers).forEach(id => {
      if (triggers[id].early || triggers[id].final) {
        highlighted.add(id);
      }
    });
    return highlighted;
  });
  const [activeToast, setActiveToast] = useState(null);

  // --- Adders (Append NOT Replace) ---
  const addAssignment = (newAssignment) => {
    if (!userId) return;
    setAssignments((prev) => {
      const updated = [...prev, newAssignment];
      localStorage.setItem(`assignments_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const addHackathon = (newHackathon) => {
    if (!userId) return;
    setHackathons((prev) => {
      const updated = [...prev, newHackathon];
      localStorage.setItem(`hackathons_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const addReminder = (newReminder) => {
    if (!userId) return;
    setReminders((prev) => {
      const updated = [...prev, newReminder];
      localStorage.setItem(`reminders_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const removeReminder = (id) => {
    if (!userId) return;
    setReminders((prev) => {
      const updated = prev.filter(r => (r._id || r.id) !== id);
      localStorage.setItem(`reminders_${userId}`, JSON.stringify(updated));
      return updated;
    });
    // Also clean up from triggers and highlighted sets
    setReminderTriggers(prev => {
      const updated = { ...prev };
      delete updated[id];
      localStorage.setItem(`reminderTriggers_${userId}`, JSON.stringify(updated));
      return updated;
    });
    setHighlightedReminders(prev => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  };

  // --- Backend Sync on App Load ---
  useEffect(() => {
    const syncTasks = async () => {
      const token = localStorage.getItem("token");
      if (!token || !userId) return;

      try {
        const [aRes, hRes, rRes] = await Promise.all([
          fetch("/api/assignments/list", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/hackathons/list", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/reminders/list", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const [aData, hData, rData] = await Promise.all([aRes.json(), hRes.json(), rRes.json()]);

        if (aData.success) {
          setAssignments(aData.assignments);
          localStorage.setItem(`assignments_${userId}`, JSON.stringify(aData.assignments));
        }
        if (hData.success) {
          setHackathons(hData.hackathons);
          localStorage.setItem(`hackathons_${userId}`, JSON.stringify(hData.hackathons));
        }
        if (rData.success) {
          setReminders(rData.reminders);
          localStorage.setItem(`reminders_${userId}`, JSON.stringify(rData.reminders));
        }
      } catch (err) {
        console.error("❌ Task sync error:", err);
      }
    };
    syncTasks();
  }, [userId]);

  // --- Global Notification Sound ---
  const playNotificationSound = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.play().catch((err) => console.log("🔇 Audio play blocked or failed:", err));
  };

  // --- Smart Reminder Engine ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const today = new Date().toISOString().split("T")[0];
      const updatedTriggers = { ...reminderTriggers };
      let changed = false;

      reminders.forEach((r) => {
        if (!r._id || !r.time) return;

        // ✅ Calculate target timestamp using LOCAL time (to match UI display)
        const [hours, minutes] = r.time.split(":").map(Number);
        const targetDate = new Date(now);
        targetDate.setHours(hours, minutes, 0, 0);
        const reminderTimestamp = targetDate.getTime();

        // ✅ Robust duration calculation
        const createdAt = new Date(r.createdAt || r.date || now).getTime();
        const totalDuration = reminderTimestamp - createdAt;
        const timeLeft = reminderTimestamp - now;

        const triggerState = updatedTriggers[r._id] || { early: false, final: false };

        // 1. Early Warning (50% time remaining)
        // Only trigger if session is meaningful (> 10s) and we're actually halfway
        if (!triggerState.early && totalDuration > 10000 && timeLeft <= totalDuration * 0.5 && timeLeft > 0) {
          triggerState.early = true;
          changed = true;
          setActiveToast({ message: `🟡 Halfway there: ${r.title}`, type: "early" });
          playNotificationSound();
          setHighlightedReminders((prev) => new Set([...prev, r._id]));
        }

        // 2. Final Alert (Time expired)
        if (!triggerState.final && timeLeft <= 0) {
          triggerState.final = true;
          changed = true;
          setActiveToast({ message: `🔴 TIME'S UP: ${r.title}`, type: "final" });
          playNotificationSound();
          setHighlightedReminders((prev) => new Set([...prev, r._id]));
        }

        updatedTriggers[r._id] = triggerState;
      });

      if (changed) {
        setReminderTriggers(updatedTriggers);
        localStorage.setItem("reminderTriggers", JSON.stringify(updatedTriggers));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reminders, reminderTriggers]);

  const clearToast = () => setActiveToast(null);


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
          videosWatched: data.videosWatched ?? prev.videosWatched,
          videosSwitched: data.videosSwitched ?? prev.videosSwitched,
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

  // 📝 Fetch saved notes + tags once on load
  useEffect(() => {
    const fetchNotesTags = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("/api/tracking/notes-tags", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setAppState((prev) => ({
            ...prev,
            notes: data.notes || {},
            tags: data.tags || {},
          }));

          localStorage.setItem("userNotes", JSON.stringify(data.notes || {}));
          localStorage.setItem("userTags", JSON.stringify(data.tags || {}));
        }
      } catch (err) {
        console.error("⚠️ Error fetching notes/tags:", err);
      }
    };

    fetchNotesTags();
  }, []);


  return (
    <AppContext.Provider
      value={{
        appState,
        setAppState,
        assignments,
        setAssignments,
        hackathons,
        setHackathons,
        reminders,
        setReminders,
        addAssignment,
        addHackathon,
        addReminder,
        removeReminder,
        activeToast,
        clearToast,
        highlightedReminders,
      }}
    >
      {activeToast && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          padding: "1rem 2rem",
          borderRadius: "12px",
          backgroundColor: "#4b5563", // Neutral gray-600
          color: "white",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          animation: "slideIn 0.3s ease-out"
        }}>
          <span>{activeToast.message}</span>
          <button onClick={clearToast} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
        </div>
      )}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
