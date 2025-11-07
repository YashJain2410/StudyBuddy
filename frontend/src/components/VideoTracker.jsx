import React, { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";


import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { io } from "socket.io-client";

// --- LOCAL STORAGE & HELPER FUNCTIONS ---

const STORAGE_KEY = "video_tracker_v3";
const INITIAL_COINS = 50;
const TAB_SWITCH_COST = 5;
const DAILY_BONUS = 1;
const STREAK_BONUS = 5;




function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        history: [],
        notes: {},
        stats: {},
        coins: INITIAL_COINS,
        streak: 0,
        lastDayWatched: null,
      };
    }
    return JSON.parse(raw);
  } catch (e) {
    return {
      history: [],
      notes: {},
      stats: {},
      coins: INITIAL_COINS,
      streak: 0,
      lastDayWatched: null,
    };
  }
}
function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function extractYouTubeId(urlOrId) {
  if (!urlOrId) return null;
  if (/^[0-9A-Za-z_-]{11}$/.test(urlOrId)) return urlOrId;
  const regex =
    /(?:youtube\.com\/.*(?:v=|embed\/)|youtu\.be\/)([0-9A-Za-z_-]{11})/;
  const m = urlOrId.match(regex);
  return m ? m[1] : null;
}


/// --- API FUNCTIONS FOR TRACKING ---
const updateBackendCoins = async (loss) => {
  try {
    const res = await fetch(`/api/tracking/coins-loss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ loss }),
    });
    const data = await res.json();
    console.log("🪙 Backend coins synced:", data);
  } catch (err) {
    console.error("Error updating backend coins:", err);
  }
};


const updateBackendCoinsGain = async (userId, amount) => {
  try {
    const res = await fetch(`/api/tracking/coins-gain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId, gain: amount }),
    });
    const data = await res.json();
    console.log("✅ Coins added:", data);
  } catch (err) {
    console.error("❌ Error adding backend coins:", err);
  }
};


const updateVideosWatched = async () => {
  try {
    const token = localStorage.getItem("token"); // 🧠 get user token
    const res = await fetch("/api/tracking/videos-watched", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include", // keep cookie if backend uses it
    });

    const data = await res.json();
    if (data.success) {
      // ✅ Update frontend streak immediately
      setAppState((prev) => ({
        ...prev,
        streak: data.streak || prev.streak,
      }));

      // ✅ Save streak in localStorage (for persistence)
      localStorage.setItem("streak", data.streak || 0);

      console.log("🔥 Streak updated successfully:", data.streak);
    } else {
      console.warn("⚠️ Backend returned error:", data.message);
    }
  } catch (err) {
    console.error("❌ Error updating streak:", err);
  }
};


const updateVideosSwitched = async (userId) => {
  try {
    const res = await fetch("/api/tracking/videos-switched", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    return data; // ✅ VERY IMPORTANT
  } catch (err) {
    console.error("Error updating video switch:", err);
  }
};


// 🧠 Add this helper function (top of file or utils)
const updateBackendStreak = async () => {
  try {
    const res = await fetch("/api/tracking/videos-watched", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) {
      setAppState((prev) => ({
        ...prev,
        streak: data.streak,
        lastDayWatched: data.lastDayWatched,
      }));
    }
  } catch (err) {
    console.error("⚠️ Error syncing streak:", err);
  }
};







// --- VIDEO TRACKER COMPONENT ---

export default function VideoTracker() {

  // --- USER ID FROM LOCAL STORAGE ---
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;

  // App state
  const { appState, setAppState } = useAppContext();
  

  const [inputUrl, setInputUrl] = useState("");
  const [videoId, setVideoId] = useState(null);
  const [localVideoFile, setLocalVideoFile] = useState(null);
  const [localVideoObjectUrl, setLocalVideoObjectUrl] = useState(null);
  


  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [sessionPlayedSeconds, setSessionPlayedSeconds] = useState(0);
  const [sessionViewsTaken, setSessionViewsTaken] = useState(0);

  const [tabSwitches, setTabSwitches] = useState(0);
  const [sessionTabSwitches, setSessionTabSwitches] = useState(0);
  
  const [noteText, setNoteText] = useState("");
  const [tagText, setTagText] = useState("");
  const [weeklyStats, setWeeklyStats] = useState({});
  const [lastFiveDays, setLastFiveDays] = useState([]);
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [focusRemaining, setFocusRemaining] = useState(null);
  const [isPlayerMaximized, setIsPlayerMaximized] = useState(false);
  const [isFocusTimerPopupMaximized, setIsFocusTimerPopupMaximized] = useState(false);
  const [youtubePlayerInstance, setYoutubePlayerInstance] = useState(null);
  const [earnedThisSessionCoins, setEarnedThisSessionCoins] = useState(false);
  const [showZeroCoinsPopup, setShowZeroCoinsPopup] = useState(false);

  // State for starting timer on play
  const [focusDuration, setFocusDuration] = useState(null);
  const [isFocusTimerPending, setIsFocusTimerPending] = useState(false);
  const [hasPlaybackStarted, setHasPlaybackStarted] = useState(false);

  // NEW STATES FOR CAMERA/OPENCV INTEGRATION
  const [showCameraAnalysis, setShowCameraAnalysis] = useState(false);
  const [cameraAnalysisResult, setCameraAnalysisResult] = useState(""); // JSON string from backend

  // refs
  const youtubePlayerRef = useRef(null);
  const localVideoRef = useRef(null);
  const pollRef = useRef(null);
  const lastSampleRef = useRef(0);
  const playerRef = useRef(null);

  // NEW REFS FOR CAMERA
  const cameraVideoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const socketRef = useRef(null);

  const [history, setHistory] = useState([]);

  const loadState = async () => {
const storedUser = JSON.parse(localStorage.getItem("user"));
const storedCoins = storedUser?.coins ?? localStorage.getItem("coins") ?? 0;
const storedStreak = storedUser?.streak ?? localStorage.getItem("streak") ?? 0;


return {
  coins: storedCoins,
  userId: storedUser?._id || storedUser?.id || null,
  secondsWatched: 0,
  focusPoints: 0,
};




};


useEffect(() => {
const fetchCoins = async () => {
const user = JSON.parse(localStorage.getItem("user"));
if (!user) return;

  try {
    const res = await fetch(`/api/tracking/coins/${user._id || user.id}`);
    if (!res.ok) throw new Error("Failed to fetch coins");
    const data = await res.json();

    setAppState((prev) => ({ ...prev, coins: data.coins }));
    localStorage.setItem("coins", data.coins);
  } catch (err) {
    console.error("Coin fetch error:", err);
  }
};

fetchCoins();
}, [setAppState]);

  // load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);



  // Create/Revoke Object URL for local video file
  useEffect(() => {
    if (localVideoFile) {
      const url = URL.createObjectURL(localVideoFile);
      setLocalVideoObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setLocalVideoObjectUrl(null);
      };
    }
  }, [localVideoFile]);

  // persist overall state when appState changes
  useEffect(() => {
    saveState(appState);
    computeWeeklyStats(appState.history);
    computeLastFiveDays(appState.history);
  }, [appState]);

  // Focus timer countdown - PAUSES when video is not playing
  useEffect(() => {
    if (focusRemaining === null || !isPlaying) return;

    if (focusRemaining <= 0) {
      setFocusRemaining(null);
      alert("🎉 Focus session complete! You've earned +1 coin.");
      setAppState(prev => ({
          ...prev,
          coins: prev.coins + 1
      }));
      return;
    }
    const t = setTimeout(() => setFocusRemaining((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [focusRemaining, isPlaying]);

useEffect(() => {
  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("/api/tracking/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAppState((p) => ({ ...p, history: data.history }));
        localStorage.setItem("userHistory", JSON.stringify(data.history));
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  fetchHistory();
}, []);



useEffect(() => {
  const savedHistory = localStorage.getItem("userHistory");
  if (savedHistory) {
    setAppState((prev) => ({
      ...prev,
      history: JSON.parse(savedHistory),
    }));
  }
}, []);

useEffect(() => {
  const fetchWeeklyStats = async () => {
    const token = localStorage.getItem("token");

    // 🧠 Try loading from cache first (for instant chart)
    const cached = localStorage.getItem("weeklyStats");
    if (cached) {
      try {
        setWeeklyStats(JSON.parse(cached));
      } catch {}
    }

    try {
      // 🛰 Fetch latest from backend
      const res = await fetch("/api/tracking/weekly-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setWeeklyStats(data.stats);
        localStorage.setItem("weeklyStats", JSON.stringify(data.stats));
      }
    } catch (err) {
      console.error("Error fetching weekly stats:", err);
    }
  };

  fetchWeeklyStats();
}, []);





  // Initialize YT player when videoId is set OR set up local video listeners
  useEffect(() => {
    if (!videoId && !localVideoObjectUrl) return;

    setPlayerReady(false);
    setIsPlaying(false);
    setSessionPlayedSeconds(0);
    setSessionViewsTaken(0);
    setEarnedThisSessionCoins(false);
    setHasPlaybackStarted(false);
    setNoteText(appState.notes?.[videoId || localVideoFile?.name] || "");
    setTagText("");
    stopPolling();


    if (videoId) {
      function createYoutubePlayer() {
        if (!window.YT || !window.YT.Player) {
          setTimeout(createYoutubePlayer, 300);
          return;
        }
        if (youtubePlayerRef.current) {
          try {
            youtubePlayerRef.current.destroy();
          } catch (e) {}
          youtubePlayerRef.current = null;
        }

        const p = new window.YT.Player("vt-youtube-player", {
          videoId,
          playerVars: { controls: 1, rel: 0, modestbranding: 1 },
          events: {
            onReady: (e) => {
              setPlayerReady(true);
              setYoutubePlayerInstance(p);
              lastSampleRef.current = p.getCurrentTime() || 0;
            },
            onStateChange: (e) => {
              const state = e.data;
              if (state === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                startPolling();
                if (isFocusTimerPending && !hasPlaybackStarted) {
                  setFocusRemaining(focusDuration);
                  setIsFocusTimerPending(false);
                  setHasPlaybackStarted(true);
                }
              } else {
                setIsPlaying(false);
                stopPolling();
                if (state === window.YT.PlayerState.ENDED) {
                  finalizeSession(true);
                   updateVideosWatched(userId);
                }
              }
            },
          },
        });
        youtubePlayerRef.current = p;
      }
      createYoutubePlayer();
    } else if (localVideoObjectUrl) {
      const videoElement = localVideoRef.current;
      if (!videoElement) return;

      const onPlay = () => {
        setIsPlaying(true);
        startPolling();
        if (isFocusTimerPending && !hasPlaybackStarted) {
          setFocusRemaining(focusDuration);
          setIsFocusTimerPending(false);
          setHasPlaybackStarted(true);
        }
      };
      const onPause = () => {
        setIsPlaying(false);
        stopPolling();
      };
      const onEnded = () => {
        setIsPlaying(false);
        stopPolling();
        finalizeSession(true);
        updateVideosWatched(userId);
      };
      const onTimeUpdate = () => {
        setCurrentTime(videoElement.currentTime);
      };
      const onReady = () => {
        setPlayerReady(true);
        lastSampleRef.current = videoElement.currentTime || 0;
      };


      videoElement.addEventListener("play", onPlay);
      videoElement.addEventListener("pause", onPause);
      videoElement.addEventListener("ended", onEnded);
      videoElement.addEventListener("timeupdate", onTimeUpdate);
      videoElement.addEventListener("loadedmetadata", onReady);

      return () => {
        videoElement.removeEventListener("play", onPlay);
        videoElement.removeEventListener("pause", onPause);
        videoElement.removeEventListener("ended", onEnded);
        videoElement.removeEventListener("timeupdate", onTimeUpdate);
        videoElement.removeEventListener("loadedmetadata", onReady);
        stopPolling();
      };
    }

    return () => stopPolling();
  }, [videoId, localVideoObjectUrl, focusDuration, hasPlaybackStarted, isFocusTimerPending]);

  // NEW useEffect for Camera and Socket Integration
  useEffect(() => {
    if (!showCameraAnalysis) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
        cameraVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        cameraVideoRef.current.srcObject = null;
      }
      return;
    }

    const socket = io("http://localhost:6000");
    socketRef.current = socket;

    socket.on("analysis", (data) => {
      setCameraAnalysisResult(data);
    });

    async function startCameraAndSendFrames() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play();
        }

        const canvas = cameraCanvasRef.current;
        const ctx = canvas.getContext("2d");

        const intervalId = setInterval(() => {
          if (cameraVideoRef.current && cameraVideoRef.current.readyState >= 2) {
            ctx.drawImage(cameraVideoRef.current, 0, 0, 320, 240);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
            socket.emit("frame", dataUrl.split(",")[1]);
          }
        }, 1000);

        return () => {
          clearInterval(intervalId);
          stream.getTracks().forEach(track => track.stop());
        };

      } catch (err) {
        console.error("Error accessing camera: ", err);
        setCameraAnalysisResult(JSON.stringify({ error: "Camera access denied or error." }));
      }
    }
    
    startCameraAndSendFrames();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [showCameraAnalysis]);

  // Polling logic
  const startPolling = () => {
    if (pollRef.current) return;

    const getPlayerCurrentTime = () => {
      if (videoId && youtubePlayerRef.current?.getCurrentTime) {
        return youtubePlayerRef.current.getCurrentTime() || 0;
      } else if (localVideoRef.current) {
        return localVideoRef.current.currentTime || 0;
      }
      return 0;
    };

    lastSampleRef.current = getPlayerCurrentTime();
    pollRef.current = setInterval(() => {
      const now = getPlayerCurrentTime();
      const last = lastSampleRef.current || 0;
      if (now >= last) {
        const delta = now - last;
        if (delta > 0 && delta < 60) {
          setSessionPlayedSeconds((s) => s + delta);
        }
      }
      lastSampleRef.current = now;
      setCurrentTime(now);
    }, 800);
  };
  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

 



  // --- BACKEND SYNC ON TAB HIDE ---
// other hooks, states, and helper functions above...

// ✅ Unified visibility handler — only deduct coins if focus timer is running
// --- Deduct coins if focus timer is running ---
useEffect(() => {
  let lastHiddenTime = 0;
  let tabSwitchTriggered = false; 
  let timeoutId = null;
  let lastSwitchTimestamp = 0; // 🧠 prevents backend double fire within same second

  const handleVisibilityChange = async () => {
    const now = Date.now();

    // ✅ Case: Tab hidden → Deduct once
    if (document.visibilityState === "hidden" && isPlaying && !tabSwitchTriggered) {
      // Prevent double-trigger if called twice quickly
      if (now - lastSwitchTimestamp < 800) return; // 🔒 stops 2 backend calls
      lastSwitchTimestamp = now;

      tabSwitchTriggered = true; 
      lastHiddenTime = now;

      if (focusRemaining > 0) {
        const deducted = TAB_SWITCH_COST;

        try {
          // ✅ 1. Deduct coins (backend)
          await updateBackendCoins(deducted);

          // ✅ 2. Update frontend coins
          setAppState((prev) => {
            const newCoins = Math.max((prev.coins || 0) - deducted, 0);
            if (newCoins <= 0) setShowZeroCoinsPopup(true);
            return { ...prev, coins: newCoins };
          });

          // ✅ 3. Update backend tab switch (only once)
          try {
            await updateVideosSwitched(userId);
            console.log("📡 Backend tab switch +1 ✅");
          } catch (e) {
            console.error("⚠️ Failed backend update:", e);
          }

          // ✅ 4. Update frontend display (+1)
          setTabSwitches((prev) => prev + 1);
          console.log("📊 Local tab switch +1 ✅");

        } catch (e) {
          console.error("❌ Coin deduction failed:", e);
        }
      }

      // ✅ Continue timer; don't reset watched seconds
      if (sessionPlayedSeconds > 0 && !earnedThisSessionCoins) {
        finalizeSession(false);
      }
      console.log("▶️ Timer continuing normally after tab switch");
    }

    // ✅ Unlock next switch (after small delay)
    if (document.visibilityState === "visible") {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        tabSwitchTriggered = false;
      }, 600);
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    clearTimeout(timeoutId);
  };
}, [isPlaying, focusRemaining, sessionPlayedSeconds, earnedThisSessionCoins, userId]);


const cleanupAfterSession = () => {
  try {
    if (playerRef?.current) {
      playerRef.current.pauseVideo?.();
      playerRef.current = null;
    }
    setSessionPlayedSeconds(0);
    setSessionViewsTaken(0);
    console.log("🧹 Focus session cleaned up!");
  } catch (err) {
    console.error("Cleanup failed:", err);
  }
};





  // --- SESSION FINALIZE ---
// ✅ Finalize and reward focus session
const finalizeSession = async (ended = false) => {
  const currentVideoIdentifier = videoId || localVideoFile?.name;
  if (!currentVideoIdentifier) return;

  const secondsWatched = Math.floor(sessionPlayedSeconds);
  if (secondsWatched <= 0 && sessionViewsTaken === 0) {
    cleanupAfterSession();
    return;
  }

  // ✅ +1 reward for completing focus session
  const reward = 1;

  try {
    console.log("🎬 Finalizing session... checking penalty order");

    // 🕒 Small delay ensures any -5 deduction from tab switch is processed first
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // ✅ Prevent multiple +1 rewards
    if (earnedThisSessionCoins) {
      console.log("⚠️ Coins for this session already awarded, skipping duplicate +1");
      cleanupAfterSession();
      return;
    }

    // ✅ Save +1 coin to backend
    const res = await fetch("/api/tracking/coins-gain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId, gain: reward }),
    });

    if (!res.ok) throw new Error("Failed to update backend coins");
    const data = await res.json();
    console.log("✅ Backend coin update:", data);

    // ✅ Update frontend coin state
    setAppState((prev) => ({
      ...prev,
      coins: (prev.coins || 0) + reward,
    }));
    localStorage.setItem("coins", (appState.coins || 0) + reward);

    // ✅ Mark session as rewarded and cleanup
    setEarnedThisSessionCoins(true);
    cleanupAfterSession();

    console.log(`🎉 Focus session complete — +${reward} coin saved!`);
  } catch (error) {
    console.error("❌ Error finalizing session:", error);
  }




  const now = new Date();
  const newHistoryEntry = {
    videoId: currentVideoIdentifier,
    url: videoId ? `https://youtu.be/${videoId}` : `file://${localVideoFile.name}`,
    watchedAt: now.toISOString(),
    seconds: secondsWatched,
    viewsTaken: sessionViewsTaken,
    notes: noteText || appState.notes?.[currentVideoIdentifier] || "",
    tag: tagText || "",
  };

  setAppState((prev) => {
    const stats = { ...(prev.stats || {}) };
    const prevStat = stats[currentVideoIdentifier] || { totalSeconds: 0, totalViews: 0 };
    stats[currentVideoIdentifier] = {
      totalSeconds: prevStat.totalSeconds + secondsWatched,
      totalViews: prevStat.totalViews + sessionViewsTaken,
    };

    let coins = prev.coins ?? INITIAL_COINS;
    let streak = prev.streak ?? 0;
    let lastDay = prev.lastDayWatched ? new Date(prev.lastDayWatched) : null;
    const todayStr = now.toISOString().split("T")[0];
    const lastDayStr = lastDay ? lastDay.toISOString().split("T")[0] : null;

    if (lastDayStr !== todayStr) {
      coins += DAILY_BONUS;
      if (lastDay) {
        const diff = (now - lastDay) / (1000 * 60 * 60 * 24);
        if (diff <= 1.5) {
          streak = (streak || 0) + 1;
          if (streak > 1) coins += STREAK_BONUS;
        } else {
          streak = 1;
        }
      } else {
        streak = 1;
      }
      lastDay = new Date(now.toISOString().split("T")[0]);
       // ✅ Backend streak update here
  if (userId) {
    updateBackendStreak(userId, streak, lastDay.toISOString());
  }
    }

    const notes = { ...(prev.notes || {}) };
    if (noteText) notes[currentVideoIdentifier] = noteText;
    const history = [...(prev.history || []), newHistoryEntry];

    // ✅ Backend sync added here
    if (!earnedThisSessionCoins && userId) {
      updateBackendCoins(userId, Math.floor(secondsWatched / 60));
    }

    return {
      ...prev,
      history,
      stats,
      notes,
      coins,
      streak,
      lastDayWatched: lastDay ? lastDay.toISOString() : prev.lastDayWatched,
    };
  });

  setEarnedThisSessionCoins(true);
  cleanupAfterSession(ended);
};


  // Data computation
  const computeWeeklyStats = (history) => {
  if (!Array.isArray(history) || history.length === 0) {
    setWeeklyStats({});
    return; // ✅ prevents crash if history is undefined or empty
  }

  const stats = {};
  history.forEach((h) => {
    const key = new Date(h.watchedAt).toLocaleDateString();
    stats[key] = (stats[key] || 0) + Math.floor(h.seconds / 60);
  });

  setWeeklyStats(stats);
};


  const computeLastFiveDays = (history) => {
  if (!Array.isArray(history)) {
    console.warn("⚠️ computeLastFiveDays called with invalid history:", history);
    setLastFiveDays([]); // prevent crash
    return;
  }

  const fiveDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 5;
  const recent = history
    .filter((h) => new Date(h.watchedAt).getTime() >= fiveDaysAgo)
    .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));

  setLastFiveDays(recent);
};

useEffect(() => {
  if (appState?.history && Array.isArray(appState.history)) {
    computeWeeklyStats(appState.history);
    computeLastFiveDays(appState.history);
  }
}, [appState.history]);


  // Save on unload
  useEffect(() => {
    const onBeforeUnload = () => {
      if (isPlaying && (sessionPlayedSeconds > 0 || sessionViewsTaken > 0)) {
        finalizeSession(false);
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isPlaying, sessionPlayedSeconds, sessionViewsTaken, videoId, localVideoFile]);

  // Utility
  const niceTime = (s) => {
    s = Math.floor(s);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h) return `${h}h ${m}m ${sec}s`;
    return m ? `${m}m ${sec}s` : `${sec}s`;
  };

  const currentActiveVideoIdentifier = videoId || localVideoFile?.name;
  const isVideoLoaded = videoId || localVideoObjectUrl;

  // --- THIS IS THE ONLY UPDATED PART ---
  const getAnalysisString = () => {
    if (!cameraAnalysisResult) return "Waiting for analysis...";
    try {
      const result = JSON.parse(cameraAnalysisResult);
      if (result.error) return `Error: ${result.error}`;
      
      let status = `Focused: ${result.focused ? "✅ Yes" : "❌ No"}\n`;
      status += `Faces Detected: ${result.faces_count}\n`;
      // Display the new phone detection status
      status += `Phone Detected: ${result.phone_detected ? "📱 Yes" : "No"}`;
      return status;
    } catch (e) {
      return `Waiting for valid data...`;
    }
  };


  const handleLoadContent = () => {
  if (!inputUrl && !localVideoFile) {
    alert("Please provide a video URL or upload a video file first!");
    return;
  }

  // Extract YouTube video ID safely
  if (inputUrl) {
    const match = inputUrl.match(
      /(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&]|$)/
    );

    if (match && match[1]) {
      setVideoId(match[1]);
      setLocalVideoFile(null);
      setShowTimerPopup(true); // reset local if YouTube chosen
    } else {
      alert("Invalid YouTube URL or ID!");
      return;
    }
  }

  // If a local video is selected
  if (localVideoFile) {
    setVideoId(null); 
      setShowTimerPopup(true);// reset YouTube if switching to local
  }
};


const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setLocalVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLocalVideoObjectUrl(objectUrl);
    setInputUrl(""); // Clear any YouTube link
  }
};

const clearHistory = () => {
  // Optional: clear backend stats if you’ve implemented an API for it
  setHistory([]);
  localStorage.removeItem("videoHistory");
  console.log("History cleared!");
};

const confirmStartFocus = () => {
  if (appState.coins <= 0) {
    alert("You don’t have enough coins to start a focus session!");
    return;
  }

  // Start the focus timer (or any logic you had before)
  setIsFocusTimerPending(true);
  setFocusRemaining(focusDuration);
  console.log("Focus session started!");
};


const fetchWeeklyStats = async () => {
  const token = localStorage.getItem("token");

  // Try cache first
  const cached = localStorage.getItem("weeklyStats");
  if (cached) {
    try {
      setWeeklyStats(JSON.parse(cached));
    } catch {}
  }

  try {
    // Fetch from backend
    const res = await fetch("/api/tracking/weekly-stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.success) {
      setWeeklyStats(data.stats);
      localStorage.setItem("weeklyStats", JSON.stringify(data.stats));
    }
  } catch (err) {
    console.error("Error fetching weekly stats:", err);
  }
};




const handleStopSave = async () => {
  try {
    if (youtubePlayerInstance?.pauseVideo) youtubePlayerInstance.pauseVideo();
    else if (localVideoRef.current && !localVideoRef.current.paused)
      localVideoRef.current.pause();

    // 🚫 Prevent accidental empty entries
    if (!sessionPlayedSeconds || sessionPlayedSeconds < 5) {
      alert("⚠️ You must watch for at least 5 seconds to save a session!");
      return;
    }

    const token = localStorage.getItem("token");
    const watchedSeconds = Math.round(sessionPlayedSeconds);
    const totalTabSwitches = tabSwitches;

    console.log("🎬 Saving session:", { videoId, watchedSeconds, totalTabSwitches });

    const response = await fetch("/api/tracking/add-history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        videoId,
        url: videoId
          ? `https://youtu.be/${videoId}`
          : localVideoFile?.name || "Local File",
        secondsWatched: watchedSeconds,
        tabSwitches: totalTabSwitches,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to save session");

    // ✅ Update frontend + localStorage
    setAppState((prev) => ({
      ...prev,
      history: data.history || prev.history,
    }));
    localStorage.setItem("userHistory", JSON.stringify(data.history));

  


    // ✅ Immediately refresh weekly stats chart here 👇
    await fetchWeeklyStats();

    // ✅ Now finalize (after saving)
    finalizeSession(true);

    alert("✅ Session saved successfully!");
  } catch (error) {
    console.error("❌ Error saving session:", error);
  }
};


const handleSaveNotes = () => {
  if (!noteText.trim()) {
    alert("Please write something before saving!");
    return;
  }

  const currentVideoKey = videoId || localVideoFile?.name;
  if (!currentVideoKey) {
    alert("No active video found!");
    return;
  }

  setAppState((prev) => ({
    ...prev,
    notes: {
      ...prev.notes,
      [currentVideoKey]: noteText,
    },
  }));

  alert("Notes saved successfully!");
};

const handleStartFocusTimer = () => {
  if (!focusMinutes || focusMinutes <= 0) {
    alert("Please enter a valid focus time!");
    return;
  }

  // ⏱️ Start the focus timer
  setFocusRemaining(focusMinutes * 60);

  // 🔒 Close the popup
  setShowTimerPopup(false);

  // 🎬 Start video automatically after popup closes
  setTimeout(() => {
    if (playerRef.current && playerRef.current.playVideo) {
      playerRef.current.playVideo(); // for YouTube
    } else if (localVideoRef.current) {
      localVideoRef.current.play(); // for local file
    }
  }, 500);
};




  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Study Video Tracker</h1>
          <div style={styles.wallet}>
            <span style={styles.statChip}>🪙 {appState.coins}</span>
            <span style={styles.statChip}>
              🔥 {appState.streak} day streak
            </span>
          </div>
        </div>

        {/* Input + Load */}
        <div style={styles.panel}>
          <div style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                placeholder="Paste YouTube URL or id..."
                value={inputUrl}
                onChange={(e) => { setInputUrl(e.target.value); setLocalVideoFile(null); }}
                style={styles.input}
                disabled={appState.coins <= 0}
              />
              <button
                onClick={handleLoadContent}
                style={styles.button}
                disabled={appState.coins <= 0 || (!inputUrl.trim() && !localVideoFile)}
              >
                {appState.coins <= 0 ? "Locked" : (videoId || localVideoFile ? "Load New" : "Load Video")}
              </button>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <label htmlFor="local-video-upload" style={{ ...styles.button, ...styles.secondaryButton, flex: 1, textAlign: 'center' }}>
                Choose Video from System
              </label>
              <input
                id="local-video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
                disabled={appState.coins <= 0}
              />
              {localVideoFile && <span style={{fontSize: "14px", color: "#4b5563"}}>Selected: {localVideoFile.name}</span>}
            </div>
            <button
              onClick={clearHistory}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Clear All
            </button>

            {/* 🎯 Focus Session Button
      <button
       onClick={() => setShowTimerPopup(true)}
       style={{ ...styles.button, background: "#10b981", marginTop: "10px" }}
       disabled={appState.coins <= 0}
      >
       🎯 Start Focus Session
</button> */}
          </div>
        </div>
        
        {/* NEW PANEL FOR CAMERA ANALYSIS */}
        <div style={styles.panel}>
          <h3 style={styles.sectionTitle}>
            👁️ Live Focus & Face Detection (OpenCV)
          </h3>
          <button
            onClick={() => setShowCameraAnalysis(prev => !prev)}
            style={{ ...styles.button, marginBottom: '16px' }}
          >
            {showCameraAnalysis ? "Stop Camera Analysis" : "Start Camera Analysis"}
          </button>

          {showCameraAnalysis && (
            <div>
              <video
                ref={cameraVideoRef}
                width="320"
                height="240"
                autoPlay
                muted
                style={{ border: "1px solid #ddd", borderRadius: "8px", marginBottom: "8px" }}
              ></video>
              <canvas ref={cameraCanvasRef} style={{ display: "none" }} width="320" height="240"></canvas>
              <h4>Analysis Result:</h4>
              <pre style={{
                backgroundColor: "#2d3748",
                color: "#e2e8f0",
                padding: "10px",
                borderRadius: "8px",
                overflowX: "auto",
                fontSize: "0.9em"
              }}>
                {getAnalysisString()}
              </pre>
            </div>
          )}
        </div>


        


        {/* Popups */}
        {showTimerPopup && (
          <div style={styles.popup}>
            <div style={isFocusTimerPopupMaximized ? styles.maximizedPopupInner : styles.popupInner}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={styles.popupTitle}>Set Focus Timer</h3>
                <button
                  onClick={() => setIsFocusTimerPopupMaximized(!isFocusTimerPopupMaximized)}
                  style={{ ...styles.smallBtn, background: '#6b7280' }}
                >
                  {isFocusTimerPopupMaximized ? "Minimize" : "Maximize"}
                </button>
              </div>
              <div style={styles.focusInputContainer}>
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={focusMinutes}
                  onChange={(e) => setFocusMinutes(Number(e.target.value))}
                  style={{ ...styles.input, fontSize: isFocusTimerPopupMaximized ? '1.5em' : '1em' }}
                />
                <span style={{ fontSize: isFocusTimerPopupMaximized ? '1.2em' : '1em' }}>minutes</span>
              </div>
              <div style={{ marginTop: "16px" }}>
                <button onClick={handleStartFocusTimer}
                  style={{ ...styles.button, fontSize: isFocusTimerPopupMaximized ? '1.2em' : '1em' }}>
                  Set Timer ({focusMinutes} min)
                </button>
                <button
                  onClick={() => {
                    setShowTimerPopup(false);
                    setVideoId(null);
                    setLocalVideoFile(null);
                    setIsFocusTimerPopupMaximized(false);
                  }}
                  style={{
                    ...styles.button,
                    ...styles.secondaryButton,
                    marginLeft: 8,
                    fontSize: isFocusTimerPopupMaximized ? '1.2em' : '1em'
                  }}
                >
                  Cancel
                </button>
              </div>
              <p style={{ ...styles.popupText, fontSize: isFocusTimerPopupMaximized ? '1.1em' : '14px' }}>
                The timer will begin when you start playing the. During
                the timer, each tab switch costs {TAB_SWITCH_COST} coins.
              </p>
            </div>
          </div>
        )}

        {showZeroCoinsPopup && (
          <div style={styles.popup}>
            <div
              style={{ ...styles.popupInner, border: "2px solid #ef4444" }}
            >
              <h3 style={{ ...styles.popupTitle, color: "#ef4444" }}>
                Out of Coins!
              </h3>
              <p style={styles.popupText}>
                Purchase Premium to continue watching.
              </p>
              <div style={{ marginTop: "16px" }}>
                <button onClick={purchasePremium} style={styles.button}>
                  Purchase (Add 100 🪙)
                </button>
                <button
                  onClick={() => setShowZeroCoinsPopup(false)}
                  style={{
                    ...styles.button,
                    ...styles.secondaryButton,
                    marginLeft: 8,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Player Area */}
        <div style={styles.panel}>
          {focusRemaining !== null && (
            <div style={styles.focusBar}>
              ⏱ Focus Time Remaining:{" "}
              <strong>
                {Math.floor(focusRemaining / 60)}:
                {String(focusRemaining % 60).padStart(2, "0")}
              </strong>
            </div>
          )}

          {isVideoLoaded ? (
            <>
              <div
                style={isPlayerMaximized ? styles.playerMax : styles.player}
              >
                {videoId && (
                  <div
                    id="vt-youtube-player"
                    style={{ width: "100%", height: "100%" }}
                  />
                )}
                {localVideoObjectUrl && (
                  <video
                    ref={localVideoRef}
                    src={localVideoObjectUrl}
                    controls
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                )}
                  <button
                    onClick={() => setIsPlayerMaximized((s) => !s)}
                    style={styles.toggleMaxMinButton}
                  >
                    {isPlayerMaximized ? "Minimize" : "Maximize"}
                  </button>
              </div>
              <div style={styles.controlsAndStats}>
                <div>
                  <button
                    onClick={handleStopSave}
                    style={{
                      ...styles.smallBtn,
                      background: "#ef4444",
                    }}
                  >
                    Stop & Save
                  </button>
                </div>
                <div style={styles.statsText}>
                   <div>
                   Watched: <strong>{niceTime(sessionPlayedSeconds)}</strong>
                    </div>
                 This Video Tab Switches: <strong>{tabSwitches}</strong>
               </div>
              </div>
              <div style={{ marginTop: "16px" }}>
                <textarea
                  placeholder="Your notes for this video..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  style={styles.textarea}
                />
                <div
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    gap: "12px",
                  }}
                >
                  <input
                    placeholder="Tag (e.g., 'React Hooks')"
                    value={tagText}
                    onChange={(e) => setTagText(e.target.value)}
                    style={{ ...styles.input, width: "250px" }}
                  />
                  <button onClick={handleSaveNotes} style={styles.button}>
                    Save Notes
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={styles.placeholder}>
              Paste a YouTube link or choose a local video to begin your study session.
            </div>
          )}
        </div>

        {/* Stats & History */}
        <div style={styles.panel}>
          <h3 style={styles.sectionTitle}>
            📊 Weekly Study Performance (minutes)
          </h3>
          <div style={{ height: 220, marginTop: "16px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.keys(weeklyStats).map((k) => ({
                  date: k,
                  mins: weeklyStats[k],
                }))}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,0,0,0.1)"
                />
                <XAxis dataKey="date" tick={{ fill: "#4b5563" }} />
                <YAxis tick={{ fill: "#4b5563" }} />
                <Tooltip contentStyle={styles.tooltip} />
                <Bar
                  dataKey="mins"
                  fill="url(#colorUv)"
                  radius={[8, 8, 0, 0]}
                />
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="#4f46e5"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="#d946ef"
                      stopOpacity={0.8}
                    />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

         {/* 🎬 History Section */}
<div style={styles.panel}>
  <h3 style={styles.sectionTitle}>🎬 Last 5 Study Sessions</h3>

  {(appState.history || []).length === 0 ? (
    <p>No recent study sessions found.</p>
  ) : (
    (appState.history || []).map((h, i) => (
      <div
        key={i}
        className="history-card"
        style={{
          background: "#f3f4f6",
          padding: "10px",
          borderRadius: "10px",
          marginBottom: "8px",
        }}
      >
        <p>
          <b>Video:</b>{" "}
          <a href={h.url} target="_blank" rel="noreferrer">
            {h.videoId}
          </a>
        </p>

        <p>
          <b>Watched:</b>{" "}
          {h.secondsWatched >= 60
            ? `${Math.floor(h.secondsWatched / 60)}m ${h.secondsWatched % 60}s`
            : `${h.secondsWatched || 0}s`}
        </p>

        <p>
          <b>Tab Switches:</b> {h.tabSwitches}
        </p>

        <p>
          <b>Date:</b> {new Date(h.watchedAt).toLocaleDateString()}
        </p>
      </div>
    ))
  )}
</div>





      </div>
    </div>
  );
}

// Basic styles to make the component runnable
const styles = {
  page: { background: '#f3f4f6', minHeight: '100vh', padding: '24px', fontFamily: 'sans-serif' },
  container: { maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '2em', color: '#111827', margin: 0 },
  wallet: { display: 'flex', gap: '12px' },
  statChip: { background: '#fff', padding: '8px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: '500', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' },
  panel: { background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' },
  input: { flexGrow: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1em' },
  button: { padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: 'white', fontSize: '1em', cursor: 'pointer' },
  secondaryButton: { background: '#e5e7eb', color: '#111827' },
  sectionTitle: { fontSize: '1.25em', color: '#111827', margin: '0 0 16px 0' },
  popup: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  popupInner: { background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px' },
  maximizedPopupInner: { background: 'white', padding: '24px', borderRadius: '12px', width: '80vw', height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  popupTitle: { fontSize: '1.5em', margin: '0 0 16px 0' },
  focusInputContainer: { display: 'flex', alignItems: 'center', gap: '12px' },
  popupText: { color: '#4b5563', lineHeight: 1.5, marginTop: '16px' },
  smallBtn: { padding: '6px 12px', borderRadius: '6px', border: 'none', color: 'white', cursor: 'pointer' },
  focusBar: { background: '#dbeafe', color: '#1e40af', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', fontWeight: '500' },
  player: { position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' },
  playerMax: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 200, background: '#000' },
  toggleMaxMinButton: { position: 'absolute', bottom: '10px', right: '10px', zIndex: 210, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' },
  controlsAndStats: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' },
  statsText: { display: 'flex', gap: '24px', color: '#4b5563' },
  textarea: { width: '100%', minHeight: '80px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1em', resize: 'vertical' },
  placeholder: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', background: '#f9fafb', borderRadius: '8px', color: '#6b7280' },
  tooltip: { background: '#fff', border: '1px solid #d1d5db', padding: '8px', borderRadius: '8px' },
};