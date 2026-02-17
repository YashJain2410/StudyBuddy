import React, { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
// import { FaceMesh } from "@mediapipe/face_mesh";
// import { Camera } from "@mediapipe/camera_utils";
import { io } from "socket.io-client";
import { jsPDF } from "jspdf";
import { Link, useNavigate } from "react-router-dom";
import profileIcon from '../assets/profile_icon.png';
import AuthModal from "./AuthModal";





import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
// import { io } from "socket.io-client";


// --- LOCAL STORAGE & HELPER FUNCTIONS ---

const STORAGE_KEY = "video_tracker_v3";
const INITIAL_COINS = 500;
const TAB_SWITCH_COST = 5;
const DAILY_BONUS = 1;
const STREAK_BONUS = 5;

// ✅ Helper: Get local date string in YYYY-MM-DD format (respects timezone)
const getLocalDateString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};




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

// --- STUDY VIDEO FILTER ---
const ALLOWED_KEYWORDS = [
  "study", "lecture", "tutorial", "math", "science",
  "coding", "programming", "react", "java", "ds algo",
  "data structures", "education", "exam", "motivation", "MySQL"
];


async function isStudyVideo(videoId) {
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
    );
    const data = await res.json();

    if (!data.title) {
      console.log("⚠️ Title missing → allowing");
      return true;
    }

    const title = data.title.toLowerCase();

    return ALLOWED_KEYWORDS.some((keyword) =>
      title.includes(keyword.toLowerCase())
    );
  } catch (e) {
    console.error("Video title check failed:", e);
    return true;
  }
}






/// --- API FUNCTIONS FOR TRACKING ---
// ✅ updateBackendStreak function removed as it was redundant and used POST incorrectly.
// Rest of utilities moved inside component to access setAppState correctly.

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


// ✅ updateBackendStreak function removed as it was redundant and used POST incorrectly.

const playRestrictionSound = () => {
  const audio = new Audio("/alert_beep1.wav");
  audio.play().catch(() => { });
};






// --- VIDEO TRACKER COMPONENT ---

export default function VideoTracker() {

  // --- USER ID FROM LOCAL STORAGE ---
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;

  // App state
  const { appState, setAppState } = useAppContext();

  // --- UTILITY FUNCTIONS ---
  const updateBackendCoins = async (loss) => {
    try {
      const res = await fetch(`/api/tracking/coins-loss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ loss }),
      });
      const data = await res.json();
      if (data.success) {
        setAppState((prev) => ({ ...prev, coins: data.coins }));
      }
    } catch (err) {
      console.error("Error updating backend coins:", err);
    }
  };

  const updateBackendCoinsGain = async (gain) => {
    try {
      const res = await fetch(`/api/tracking/coins-gain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, gain }),
      });
      const data = await res.json();
      if (data.success) {
        setAppState((prev) => ({ ...prev, coins: data.coins }));
      }
    } catch (err) {
      console.error("❌ Error adding backend coins:", err);
    }
  };

  const updateVideosWatched = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tracking/videos-watched", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        credentials: "include",
      });
      const data = await res.json();

      if (data.success && data.streak !== undefined) {
        setAppState((prev) => ({
          ...prev,
          streak: data.streak,
          lastDayWatched: data.lastDayWatched ?? prev.lastDayWatched,
        }));
        localStorage.setItem("streak", String(data.streak));
      }
    } catch (err) {
      console.error("❌ Error updating streak:", err);
    }
  };

  const [showBlockedPopup, setShowBlockedPopup] = useState(false);
  const [blockedTitle, setBlockedTitle] = useState("");

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) setUser(storedUser);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      localStorage.removeItem("user");
      setUser(null);
      setDropdownOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
      localStorage.removeItem("user");
      setUser(null);
      setDropdownOpen(false);
    }
  };

  const handleProtectedLinkClick = (e, path) => {
    if (!user) {
      e.preventDefault();
      setAuthModalOpen(true);
    }
  };

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
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState("");
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [focusRemaining, setFocusRemaining] = useState(null);
  const [isPlayerMaximized, setIsPlayerMaximized] = useState(false);
  const [isFocusTimerPopupMaximized, setIsFocusTimerPopupMaximized] = useState(false);
  const [youtubePlayerInstance, setYoutubePlayerInstance] = useState(null);
  const [earnedThisSessionCoins, setEarnedThisSessionCoins] = useState(false);
  const [showZeroCoinsPopup, setShowZeroCoinsPopup] = useState(false);
  const [coinsLoaded, setCoinsLoaded] = useState(false);


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
  // refs for swipe/trackpad navigation
  const wheelLastRef = useRef(0);
  const touchStartXRef = useRef(null);
  const wheelAccumRef = useRef(0);

  // const [showWarning, setShowWarning] = useState(false);
  // const [warningText, setWarningText] = useState("");


  //    const saveDetectionToBackend = async (payloadObj) => {
  //   try {
  //     await fetch("/api/detections/save", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       credentials: "include", // ⭐ cookie token ke liye must
  //       body: JSON.stringify(payloadObj),
  //     });
  //   } catch (err) {
  //     console.error("❌ Detection save failed:", err);
  //   }
  // };

  // const showTopWarning = (msg) => {
  //   setWarningText(msg);
  //   setShowWarning(true);

  //   setTimeout(() => {
  //     setShowWarning(false);
  //   }, 2500);
  // };

  const toggleDetector = async () => {
    try {
      if (!showCameraAnalysis) {
        await fetch("/api/detector/start", { method: "POST" });
      } else {
        await fetch("/api/detector/stop", { method: "POST" });
      }

      setShowCameraAnalysis((prev) => !prev);
    } catch (err) {
      console.log("Detector toggle error:", err);
    }
  };



  const [history, setHistory] = useState([]);

  // Monthly 5-day sliding window state for performance chart
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthData, setMonthData] = useState([]); // full month data (one item per day)
  const [monthStartIndex, setMonthStartIndex] = useState(0); // start index for visible 5-day window

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


  // ✅ REMOVED: Redundant mount-time POST call that was resetting/incrementing streak incorrectly.
  // Streak is now fetched via fetchUserStats GET call below.





  // 🧠 Split-screen detection
  // 🧠 Split-Screen Detection — Improved Version
  useEffect(() => {
    let lastAlertTime = 0;
    let alertCooldown = 2000; // 2 sec cooldown to avoid spam

    const detectSplitScreen = () => {
      if (!isPlaying || focusRemaining <= 0) return;

      const screenWidth = window.screen.width;
      const windowWidth = window.innerWidth;
      const ratio = windowWidth / screenWidth;

      // 🚨 Trigger when window width < 70%
      if (ratio < 0.7) {
        const now = Date.now();

        // Avoid rapid-fire alerts (only allow after cooldown)
        if (now - lastAlertTime > alertCooldown) {

          // Show alert TWICE — BACK TO BACK
          alert("⚠️ Focus Alert: Split screen detected!");
          alert("⚠️ Please maximize the study window to continue!");

          // OPTIONAL: Send event to backend
          if (socketRef.current) {
            socketRef.current.emit("split_screen_detected", {
              timestamp: Date.now(),
            });
          }

          lastAlertTime = now;
        }
      }
    };

    window.addEventListener("resize", detectSplitScreen);
    document.addEventListener("visibilitychange", detectSplitScreen);

    return () => {
      window.removeEventListener("resize", detectSplitScreen);
      document.removeEventListener("visibilitychange", detectSplitScreen);
    };
  }, [isPlaying, focusRemaining]);


  useEffect(() => {
    const savedNotes = localStorage.getItem(`userNotes_${userId}`);

    const savedTags = localStorage.getItem(`userTags_${userId}`);


    if (savedNotes || savedTags) {
      setAppState(prev => ({
        ...prev,
        notes: savedNotes ? JSON.parse(savedNotes) : {},
        tags: savedTags ? JSON.parse(savedTags) : {}
      }));
    }
  }, []);





  // useEffect(() => {
  // const fetchCoins = async () => {
  // const user = JSON.parse(localStorage.getItem("user"));
  // if (!user) return;

  //   try {
  //     const res = await fetch(`/api/tracking/coins/${user._id || user.id}`);
  //     if (!res.ok) throw new Error("Failed to fetch coins");
  //     const data = await res.json();

  //     setAppState((prev) => ({ ...prev, coins: data.coins }));
  //     localStorage.setItem("coins", data.coins);
  //   } catch (err) {
  //     console.error("Coin fetch error:", err);
  //   }
  // };

  // fetchCoins();
  // }, [setAppState]);



  useEffect(() => {
    const fetchUserStats = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;

      try {
        const res = await fetch(`/api/tracking/coins/${user._id || user.id}`);
        if (!res.ok) throw new Error("Failed to fetch user stats");
        const data = await res.json();

        if (data.success) {
          setAppState((prev) => ({
            ...prev,
            coins: data.coins ?? prev.coins,
            streak: data.streak ?? prev.streak,
          }));

          // Cache in localStorage
          if (data.coins !== undefined) localStorage.setItem(`coins_${userId}`, data.coins);
          if (data.streak !== undefined) localStorage.setItem("streak", data.streak);
        }

        setCoinsLoaded(true);
      } catch (err) {
        console.error("User stats fetch error:", err);
        setCoinsLoaded(true);
      }
    };

    fetchUserStats();
  }, [setAppState, userId]);

  // ✅ NEW: Fetch notes and tags from backend on mount
  useEffect(() => {
    const fetchNotesTags = async () => {
      if (!userId) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/tracking/notes-tags", {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });
        const data = await res.json();
        if (data.success) {
          setAppState(prev => ({
            ...prev,
            notes: data.notes || {},
            tags: data.tags || {}
          }));
        }
      } catch (err) {
        console.error("⚠️ Error fetching notes/tags:", err);
      }
    };

    fetchNotesTags();
  }, [userId]);


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
          const newHistory = data.history || [];

          setAppState((prev) => ({ ...prev, history: newHistory }));

          // Update cache
          localStorage.setItem(`userHistory_${userId}`, JSON.stringify(newHistory));
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };

    fetchHistory();
  }, [userId, userId]); // Keep userId dependency




  useEffect(() => {
    const savedHistory = localStorage.getItem(`userHistory_${userId}`);
    if (savedHistory && (!appState.history || appState.history.length === 0)) {
      setAppState((prev) => ({
        ...prev,
        history: JSON.parse(savedHistory),
      }));
    }
  }, [userId]);

  // ✅ Build monthData (minutes per day) from appState.history whenever history / month / year change
  // IMPORTANT: This uses the FULL history array (ALL sessions from database), NOT just the last 5.
  // The history cards below are sliced to show only 5, but the graph must show ALL data.
  useEffect(() => {
    const buildMonthData = () => {
      const year = Number(selectedYear);
      const month = Number(selectedMonth);
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // ✅ Use FULL history array - no slicing here!
      const historyArr = (appState.history && appState.history.length > 0)
        ? appState.history
        : JSON.parse(localStorage.getItem(`userHistory_${userId}`)) || [];


      // ✅ Aggregate ALL sessions by date (sum of all sessions per day)
      const dailySecs = {};
      historyArr.forEach(item => {
        const dateKey = item.watchedAt ? (item.watchedAt.split("T")[0] || item.watchedAt) : "";
        if (!dateKey) return;
        const secs = Number(item.seconds ?? item.secondsWatched ?? 0) || 0;
        dailySecs[dateKey] = (dailySecs[dateKey] || 0) + secs;
      });

      const dailyTotals = {};
      Object.keys(dailySecs).forEach(key => {
        dailyTotals[key] = Math.floor(dailySecs[key] / 60);
      });

      const arr = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const dateKey = getLocalDateString(dateObj);
        arr.push({
          dateKey,
          label: `${MONTHS[month]} ${d}`,
          mins: dailyTotals[dateKey] || 0,
        });
      }

      setMonthData(arr);

      // Auto-position to show last 10 days ending on today
      const today = new Date();
      const todayDate = today.getDate();
      const todayMonth = today.getMonth();
      const todayYear = today.getFullYear();
      // Only auto-position if we're viewing the current month
      if (month === todayMonth && year === todayYear) {
        const endDay = Math.min(todayDate, daysInMonth);
        const startDay = Math.max(1, endDay - 9); // 10-day window
        setMonthStartIndex(startDay - 1); // -1 because arr is 0-indexed but days are 1-indexed
      } else {
        setMonthStartIndex(0);
      }
    };

    buildMonthData();
  }, [appState.history, selectedMonth, selectedYear]);

  // Handlers for trackpad (wheel) and touch swipes to navigate by 10-day frames
  const handleWheelNav = (e) => {
    // only react to primarily horizontal wheel gestures
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;

    // accumulate horizontal deltas to make transitions stable/smooth
    wheelAccumRef.current += e.deltaX;
    const THRESH = 120; // pixels accumulated before changing frame
    const acc = wheelAccumRef.current;

    if (Math.abs(acc) >= THRESH) {
      const steps = Math.max(1, Math.floor(Math.abs(acc) / THRESH));
      if (acc > 0) {
        setMonthStartIndex((s) => Math.min(Math.max(0, monthData.length - 10), s + steps * 10));
      } else {
        setMonthStartIndex((s) => Math.max(0, s - steps * 10));
      }
      wheelAccumRef.current = 0;
      wheelLastRef.current = Date.now();
    }
  };

  const onTouchStart = (e) => {
    touchStartXRef.current = e.touches?.[0]?.clientX ?? null;
  };

  const onTouchEnd = (e) => {
    const start = touchStartXRef.current;
    if (start == null) return;
    const end = e.changedTouches?.[0]?.clientX ?? start;
    const diff = start - end;
    // increased threshold for more stable swipes
    if (Math.abs(diff) < 80) {
      touchStartXRef.current = null;
      return;
    }
    if (diff > 0) {
      // swipe left -> next
      setMonthStartIndex((s) => Math.min(Math.max(0, monthData.length - 10), s + 10));
    } else {
      // swipe right -> prev
      setMonthStartIndex((s) => Math.max(0, s - 10));
    }
    touchStartXRef.current = null;
  };

  // ✅ fetchWeeklyStats removed from here as it's now handled by fetchHistory + buildMonthData



  useEffect(() => {
    const coins = Number(appState.coins);

    if (!isNaN(coins) && coins <= 0) {
      setShowZeroCoinsPopup(true);
    } else {
      setShowZeroCoinsPopup(false);
    }
  }, [appState.coins]);





  // Initialize YT player when videoId is set OR set up local video listeners
  useEffect(() => {
    if (!videoId && !localVideoObjectUrl) return;

    setPlayerReady(false);
    setIsPlaying(false);
    setSessionPlayedSeconds(0);
    setSessionViewsTaken(0);
    setEarnedThisSessionCoins(false);
    setHasPlaybackStarted(false);
    const currentVideoKey = videoId || localVideoFile?.name;
    setNoteText(""); // 📓 Running notebook: start with empty textarea for new entries
    setTagText(appState.tags?.[currentVideoKey] || "");

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
          } catch (e) { }
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
          setFocusRemaining(focusMinutes * 60);

          //setFocusRemaining(focusDuration);
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





  // useEffect(() => {
  //   if (!showCameraAnalysis) return;

  //   let camera = null;
  //   let faceMesh = null;

  //   // ✅ throttle (5 sec me 1 baar save)
  //   let lastSentTime = 0;

  //   const startFaceMesh = async () => {
  //     try {
  //       faceMesh = new FaceMesh({
  //         locateFile: (file) =>
  //           `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  //       });

  //       faceMesh.setOptions({
  //         maxNumFaces: 3, // ✅ multiple faces detect
  //         refineLandmarks: true,
  //         minDetectionConfidence: 0.6,
  //         minTrackingConfidence: 0.6,
  //       });

  //       faceMesh.onResults((results) => {
  //         const facesCount = results?.multiFaceLandmarks?.length || 0;

  //         let direction = "unknown";
  //         let focused = false;

  //         // ✅ 1 face = focused
  //         if (facesCount === 1) {
  //           focused = true;

  //           const lm = results.multiFaceLandmarks[0];
  //           const nose = lm[1];

  //           // Left/Right/Center detection
  //           if (nose.x < 0.42) direction = "left";
  //           else if (nose.x > 0.58) direction = "right";
  //           else direction = "center";
  //         }

  //         // 🚨 No face or multiple faces => not focused
  //         if (facesCount === 0 || facesCount > 1) {
  //           focused = false;
  //         }

  //         // ✅ payload (backend ke according)
  //         const payload = {
  //           focused,
  //           faces_count: facesCount,
  //           direction,
  //         };

  //         // UI update
  //         setCameraAnalysisResult(JSON.stringify(payload));

  //         // ================== ✅ WARNINGS ==================
  //         if (facesCount === 0) {
  //           showTopWarning("Face not detected! Please sit properly 👀");
  //         } else if (facesCount > 1) {
  //           showTopWarning("Multiple faces detected! Only you should be present 🚫");
  //         } else {
  //           // 1 face but looking away
  //           if (direction === "left" || direction === "right") {
  //             showTopWarning(`You are looking ${direction}. Focus on screen 📌`);
  //           }
  //         }
  //         // =================================================

  //         // ✅ backend save (5 sec me 1 baar)
  //         const now = Date.now();
  //         if (now - lastSentTime > 60000) {
  //           lastSentTime = now;
  //           saveDetectionToBackend(payload);
  //         }
  //       });

  //       // ✅ Start camera
  //       camera = new Camera(cameraVideoRef.current, {
  //         onFrame: async () => {
  //           if (cameraVideoRef.current) {
  //             await faceMesh.send({ image: cameraVideoRef.current });
  //           }
  //         },
  //         width: 640,
  //         height: 480,
  //       });

  //       camera.start();
  //     } catch (err) {
  //       console.error("FaceMesh error:", err);
  //       setCameraAnalysisResult(
  //         JSON.stringify({ error: err.message || "FaceMesh failed" })
  //       );
  //     }
  //   };

  //   startFaceMesh();

  //   return () => {
  //     if (camera) camera.stop();
  //     if (faceMesh) faceMesh.close();
  //   };
  // }, [showCameraAnalysis]);



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
  // // --- Deduct coins if focus timer is running ---
  // useEffect(() => {
  //   let lastHiddenTime = 0;
  //   let tabSwitchTriggered = false; 
  //   let timeoutId = null;
  //   let lastSwitchTimestamp = 0; // 🧠 prevents backend double fire within same second




  //   const handleVisibilityChange = async () => {
  //     const now = Date.now();

  //     // ✅ Case: Tab hidden → Deduct once
  //    if (document.visibilityState === "hidden" && focusRemaining > 0 && !tabSwitchTriggered) {

  //       // Prevent double-trigger if called twice quickly
  //       if (now - lastSwitchTimestamp < 800) return; // 🔒 stops 2 backend calls
  //       lastSwitchTimestamp = now;

  //       tabSwitchTriggered = true; 
  //       lastHiddenTime = now;

  //       if (focusRemaining > 0) {
  //         const deducted = TAB_SWITCH_COST;

  //         try {
  //           // ✅ 1. Deduct coins (backend)
  //           await updateBackendCoins(deducted);

  //           // ✅ 2. Update frontend coins
  //           setAppState((prev) => {
  //             const newCoins = Math.max((prev.coins || 0) - deducted, 0);
  //             if (newCoins <= 0) setShowZeroCoinsPopup(true);
  //             return { ...prev, coins: newCoins };
  //           });

  //           // ✅ 3. Update backend tab switch (only once)
  //           try {
  //             await updateVideosSwitched(userId);
  //             console.log("📡 Backend tab switch +1 ✅");
  //           } catch (e) {
  //             console.error("⚠️ Failed backend update:", e);
  //           }

  //           // ✅ 4. Update frontend display (+1)
  //           setTabSwitches((prev) => prev + 1);
  //           console.log("📊 Local tab switch +1 ✅");

  //         } catch (e) {
  //           console.error("❌ Coin deduction failed:", e);
  //         }
  //       }

  //       // ✅ Continue timer; don't reset watched seconds
  //       // if (sessionPlayedSeconds > 0 && !earnedThisSessionCoins) {
  //       //   finalizeSession(false);
  //       // }
  //       // console.log("▶️ Timer continuing normally after tab switch");
  //     }

  //     // ✅ Unlock next switch (after small delay)
  //     if (document.visibilityState === "visible") {
  //       clearTimeout(timeoutId);
  //       timeoutId = setTimeout(() => {
  //         tabSwitchTriggered = false;
  //       }, 600);
  //     }
  //   };

  //   document.addEventListener("visibilitychange", handleVisibilityChange);
  //   return () => {
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  //     clearTimeout(timeoutId);
  //   };
  // }, [isPlaying, focusRemaining, sessionPlayedSeconds, earnedThisSessionCoins, userId]);



  useEffect(() => {
    let tabSwitchTriggered = false;
    let timeoutId = null;
    let lastSwitchTimestamp = 0;

    const handleVisibilityChange = async () => {
      const now = Date.now();

      // ✅ Tab switch penalty when video is playing (YouTube + Local)
      if (
        (document.visibilityState === "hidden" || document.hasFocus() === false) &&
        isPlaying &&
        !tabSwitchTriggered
      ) {
        if (now - lastSwitchTimestamp < 800) return;
        lastSwitchTimestamp = now;

        tabSwitchTriggered = true;

        const deducted = TAB_SWITCH_COST;

        try {
          await updateBackendCoins(deducted);

          setAppState((prev) => {
            const newCoins = Math.max((prev.coins || 0) - deducted, 0);
            if (newCoins <= 0) setShowZeroCoinsPopup(true);
            return { ...prev, coins: newCoins };
          });

          await updateVideosSwitched(userId);

          setTabSwitches((prev) => prev + 1);
          console.log("📊 Tab switch +1 ✅");
        } catch (e) {
          console.error("❌ Coin deduction failed:", e);
        }
      }

      // unlock
      if (document.visibilityState === "visible") {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          tabSwitchTriggered = false;
        }, 600);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleVisibilityChange);
      clearTimeout(timeoutId);
    };
  }, [isPlaying, userId]);



  const cleanupAfterSession = () => {
    try {
      if (playerRef?.current) {
        playerRef.current.pauseVideo?.();
        playerRef.current = null;
      }
      // setSessionPlayedSeconds(0);
      setSessionViewsTaken(0);
      console.log("🧹 Focus session cleaned up!");
    } catch (err) {
      console.error("Cleanup failed:", err);
    }
  };





  // --- SESSION FINALIZE ---
  // ✅ Finalize and reward focus session
  const finalizeSession = async (ended = false) => {

    //new add
    if (window.__alreadyFinalized) {
      console.log("⛔ finalize blocked (already ran)");
      return;
    }
    window.__alreadyFinalized = true;

    //window.__alreadyFinalized = true;

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

      // ✅ Reward 1 coin for focus session completion
      if (!earnedThisSessionCoins) {
        await updateBackendCoinsGain(reward);
        setEarnedThisSessionCoins(true);
      }

      cleanupAfterSession();
      console.log(`🎉 Focus session complete — +${reward} coin saved!`);
    } catch (error) {
      console.error("❌ Error finalizing session:", error);
    }




    const now = new Date();
    const todayStr = getLocalDateString(now);
    const dayChanged = appState.lastDayWatched !== todayStr;

    const newHistoryEntry = {
      videoId: currentVideoIdentifier,
      url: videoId ? `https://youtu.be/${videoId}` : `file://${localVideoFile.name}`,
      watchedAt: todayStr,
      seconds: secondsWatched,
      viewsTaken: sessionViewsTaken,
      note: noteText || appState.notes?.[currentVideoIdentifier] || "",
      tag: tagText || "",
    };

    setAppState((prev) => {
      const stats = { ...(prev.stats || {}) };
      const prevStat = stats[currentVideoIdentifier] || { totalSeconds: 0, totalViews: 0 };
      stats[currentVideoIdentifier] = {
        totalSeconds: prevStat.totalSeconds + secondsWatched,
        totalViews: prevStat.totalViews + sessionViewsTaken,
      };

      let coins = prev.coins ?? 0;
      let streak = prev.streak ?? 0;
      let lastDayStr = prev.lastDayWatched || null;

      if (dayChanged) {
        coins += DAILY_BONUS;
        // Simple streak logic for frontend display, backend handles it robustly
        if (lastDayStr) {
          const lastUTC = new Date(lastDayStr).getTime();
          const todayUTC = new Date(todayStr).getTime();
          const diffDays = Math.round((todayUTC - lastUTC) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) streak += 1;
          else if (diffDays > 1) streak = 1;
        } else {
          streak = 1;
        }
        lastDayStr = todayStr;
      }

      const notes = { ...(prev.notes || {}), [currentVideoIdentifier]: (prev.notes?.[currentVideoIdentifier] ? prev.notes[currentVideoIdentifier] + "\n" + noteText : noteText).trim() };
      const history = [...(prev.history || []), newHistoryEntry];

      return {
        ...prev,
        history,
        stats,
        notes,
        coins,
        streak,
        lastDayWatched: lastDayStr,
      };
    });

    // ✅ Backend sync outside setAppState for reliability
    await updateVideosWatched();

    cleanupAfterSession(ended);

    // Finalize lock
    setTimeout(() => {
      window.__alreadyFinalized = false;
      console.log("🔓 finalize unlocked");
    }, 2000);

  };


  // Data computation

  // Removed redundant effects


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

      if (result.faces_count === 0) {
        status += "⚠️ No face detected";
      } else if (result.faces_count > 1) {
        status += "🚨 Multiple faces detected";
      } else {
        status += `Direction: ${result.direction}\n`;
        if (result.direction === "left" || result.direction === "right") {
          status += "⚠️ Please look at the screen";
        }
      }

      return status;
    } catch (e) {
      return "Waiting for valid data...";
    }
  };




  const handleLoadContent = async () => {

    if (appState.coins === 0) {
      setShowZeroCoinsPopup(true);
      return;
    }


    if (!inputUrl && !localVideoFile) {
      alert("Please provide a video URL or upload a video file first!");
      return;
    }

    // If YouTube URL given
    if (inputUrl) {
      const match = inputUrl.match(
        /(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&]|$)/
      );

      if (!match || !match[1]) {
        alert("Invalid YouTube URL or ID!");
        return;
      }

      const id = match[1];

      // 🔥 Study Check
      const allowed = await isStudyVideo(id);
      if (!allowed) {
        setBlockedTitle("This video is not study related!");
        setShowBlockedPopup(true);
        playRestrictionSound();   // 🔔 ADD THIS LINE
        return;
      }


      setVideoId(id);
      setLocalVideoFile(null);
      setShowTimerPopup(true);
      return;
    }

    // If local video chosen
    if (localVideoFile) {
      setVideoId(null);
      setShowTimerPopup(true);
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


  // ✅ fetchWeeklyStats removed from here as it's redundant







  const handleStopSave = async () => {
    try {
      if (youtubePlayerInstance?.pauseVideo) youtubePlayerInstance.pauseVideo();
      else if (localVideoRef.current && !localVideoRef.current.paused)
        localVideoRef.current.pause();

      if (!sessionPlayedSeconds || sessionPlayedSeconds < 5) {
        alert("⚠️ Watch at least 5 seconds before saving!");
        return;
      }

      const token = localStorage.getItem("token");
      const watchedSeconds = Math.round(sessionPlayedSeconds);
      const totalTabSwitches = tabSwitches;

      const currentVideoKey = videoId || localVideoFile?.name;

      console.log("🎬 Saving session with notes & tag:", {
        videoId,
        watchedSeconds,
        totalTabSwitches,
        noteText,
        tagText,
      });

      // ✅ Send ALL data including notes + tag in ONE request
      const response = await fetch("/api/tracking/add-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoId: currentVideoKey,
          url: videoId
            ? `https://youtu.be/${videoId}`
            : localVideoFile?.name || "Local File",
          secondsWatched: watchedSeconds,
          tabSwitches: totalTabSwitches,
          note: (appState.notes?.[currentVideoKey] ? appState.notes[currentVideoKey] + "\n" + noteText : noteText).trim(),
          tag: tagText,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      // Update UI history and stats
      setAppState((prev) => ({
        ...prev,
        history: data.history,
        notes: { ...(prev.notes || {}), [currentVideoKey]: (prev.notes?.[currentVideoKey] ? prev.notes[currentVideoKey] + "\n" + noteText : noteText).trim() }
      }));
      localStorage.setItem(`userHistory_${userId}`, JSON.stringify(data.history));


      // Chart is automatically updated via useEffect [appState.history]

      // Clean up session
      finalizeSession(true);

      alert("✅ Session + Notes + Tag saved!");
    } catch (error) {
      console.error("❌ Error saving session:", error);
    }
  };


  const purchasePremium = () => {
    const options = {
      key: "rzp_test_123456789", // ← replace with your Razorpay test key
      amount: 299 * 100,         // ₹299
      currency: "INR",
      name: "StudyBuddy Premium",
      description: "Unlock premium coins and features",

      handler: function (response) {
        // SUCCESS → add coins
        setAppState(prev => ({
          ...prev,
          coins: (prev.coins || 0) + 100,
          premium: true,
        }));

        localStorage.setItem("coins", (appState.coins || 0) + 100);
        localStorage.setItem("premium", "true");

        alert("🎉 Payment Successful! Premium Activated!");
        setShowZeroCoinsPopup(false);
      },

      theme: { color: "#4f46e5" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };




  // ⬇️ Download note as PDF
  const handleDownloadPDF = () => {
    if (!selectedNote.trim()) return;

    try {
      // Create a canvas element to render text
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1100;
      const ctx = canvas.getContext('2d');

      // Set up the canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('Study Note', 40, 60);

      // Add date
      ctx.font = '12px Arial';
      ctx.fillStyle = '#666666';
      ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 40, 90);

      // Add note content
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      const maxWidth = 720;
      const lineHeight = 20;
      let y = 130;

      // Word wrap text
      const words = selectedNote.split(' ');
      let line = '';

      for (let i = 0; i < words.length; i++) {
        const test = line + words[i] + ' ';
        const metrics = ctx.measureText(test);

        if (metrics.width > maxWidth && line) {
          ctx.fillText(line, 40, y);
          y += lineHeight;
          line = words[i] + ' ';
        } else {
          line = test;
        }
      }
      if (line) {
        ctx.fillText(line, 40, y);
      }

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `study-note-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download note');
    }
  };

  // 📝 Generate and handle Note PDF (View or Download)
  const generateNotePDF = (noteContent, fileName, mode = 'download') => {
    if (!noteContent) return;

    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - (margin * 2);

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Study Session Note", margin, 20);

    // Metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 30);
    doc.line(margin, 35, pageWidth - margin, 35);

    // Content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0);

    const splitText = doc.splitTextToSize(noteContent, maxWidth);
    doc.text(splitText, margin, 45);

    if (mode === 'view') {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        alert("Popup blocked! Please allow popups for this site to view the PDF.");
      }
    } else {
      doc.save(`${fileName}.pdf`);
    }
  };

  // ⬇️ put handleSaveNotes here, inside component ⬇️
  const handleSaveNotes = async () => {
    if (!noteText.trim() && !tagText.trim()) {
      alert("Please enter a note or tag before saving!");
      return;
    }

    const currentVideoKey = videoId || localVideoFile?.name;
    if (!currentVideoKey) {
      alert("No active video found!");
      return;
    }

    const existingNote = appState.notes?.[currentVideoKey] || "";
    const updatedNote = (existingNote ? existingNote + "\n" + noteText : noteText).trim();

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tracking/save-note-tag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        credentials: "include",
        body: JSON.stringify({
          videoId: currentVideoKey,
          noteText: updatedNote,
          tagText,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to save notes");

      setAppState((prev) => ({
        ...prev,
        notes: data.notes || prev.notes,
        tags: data.tags || prev.tags,
        history: data.history || prev.history,
      }));

      setNoteText(""); // 📓 Clear textarea after appending

      localStorage.setItem(
        `userNotes_${userId}`,
        JSON.stringify({ ...appState.notes, ...data.notes })
      );

      localStorage.setItem(
        `userTags_${userId}`,
        JSON.stringify({ ...appState.tags, ...data.tags })
      );


      alert("✅ Notes & Tag saved successfully!");
    } catch (err) {
      console.error("❌ Error saving note/tag:", err);
      alert("Failed to save note or tag.");
    }
  };



  // const handleStartFocusTimer = () => {
  //   if (!focusMinutes || focusMinutes <= 0) {
  //     alert("Please enter a valid focus time!");
  //     return;
  //   }

  //   // ⏱️ Start the focus timer
  //   setFocusRemaining(focusMinutes * 60);

  //   // 🔒 Close the popup
  //   setShowTimerPopup(false);

  //   // 🎬 Start video automatically after popup closes
  //   setTimeout(() => {
  //     if (playerRef.current && playerRef.current.playVideo) {
  //       playerRef.current.playVideo(); // for YouTube
  //     } else if (localVideoRef.current) {
  //       localVideoRef.current.play(); // for local file
  //     }
  //   }, 500);
  // };


  const handleStartFocusTimer = () => {
    // ✅ Focus timer ONLY for YouTube
    if (!videoId) {
      alert("Focus timer only works for YouTube videos.");
      setShowTimerPopup(false);
      return;
    }

    if (!focusMinutes || focusMinutes <= 0) {
      alert("Please enter a valid focus time!");
      return;
    }

    setFocusRemaining(focusMinutes * 60);
    setShowTimerPopup(false);

    setTimeout(() => {
      if (youtubePlayerRef.current?.playVideo) {
        youtubePlayerRef.current.playVideo();
      }
    }, 500);
  };





  return (
    <div style={{ ...styles.page, padding: 0 }}>
      {/* Navbar */}
      <nav className="bg-white/30 backdrop-blur-lg shadow-lg py-4 px-8 flex justify-between items-center sticky top-0 z-50 rounded-b-2xl">
        <Link
          to="/"
          className="text-2xl font-extrabold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 bg-clip-text text-transparent tracking-tight"
        >
          StudyBuddy
        </Link>

        <div className="hidden md:flex gap-8 font-medium">
          <Link
            to="/dashboard"
            onClick={(e) => handleProtectedLinkClick(e, '/dashboard')}
            className="hover:text-pink-500 transition-colors duration-300"
          >
            Dashboard
          </Link>
          <button
            onClick={() => navigate("/")}
            className="hover:text-pink-500 transition-colors duration-300"
          >
            About Us
          </button>
          <Link to="/blogs" className="hover:text-pink-500 transition-colors duration-300">Blogs</Link>
          <Link to="/contact" className="hover:text-pink-500 transition-colors duration-300">Contact Us</Link>
        </div>

        {user ? (
          <div className="relative">
            <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 cursor-pointer">
              <img
                src={user.profileImage || profileIcon}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-indigo-700"
              />
              <span className="font-semibold text-gray-900">{user.name}</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-xl z-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-3">
            <Link
              to="/login"
              className="px-4 py-2 border border-indigo-700 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-all duration-300"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-gradient-to-r from-indigo-700 to-pink-600 text-white rounded-lg shadow-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
            >
              Sign Up
            </Link>
          </div>
        )}
      </nav>

      <div style={{ ...styles.container, padding: "24px" }}>
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
              {localVideoFile && <span style={{ fontSize: "14px", color: "#4b5563" }}>Selected: {localVideoFile.name}</span>}
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

        {/* NEW PANEL FOR CAMERA ANALYSIS
        <div style={styles.panel}>
          <h3 style={styles.sectionTitle}>
            👁️ Live Focus & Face Detection (OpenCV)
          </h3>
          <button
          onClick={toggleDetector}

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

                 <div style={{ marginTop: "20px" }}>
      <h3>📊 Focus Dashboard</h3>

      <iframe
        src="http://localhost:8501"
        style={{
          width: "100%",
          height: "400px",
          border: "none",
          borderRadius: "12px",
        }}
      />
      </div>
            </div>
          )}
        </div> */}



        {/* NEW PANEL FOR CAMERA ANALYSIS */}
        <div style={styles.panel}>
          <h3 style={styles.sectionTitle}>
            👁️ Live Focus & Face Detection (OpenCV)
          </h3>

          <button
            onClick={toggleDetector}
            style={{ ...styles.button, marginBottom: "16px" }}
          >
            {showCameraAnalysis ? "Stop Camera Analysis" : "Start Camera Analysis"}
          </button>

          {showCameraAnalysis && (
            <div>
              <h4 style={{ marginBottom: "10px" }}>
                📷 Live Camera (Face + Phone Detection)
              </h4>

              <img
                src="http://localhost:5001/video_feed"
                alt="Live Detector Feed"
                style={{
                  width: "100%",
                  maxWidth: "520px",
                  borderRadius: "12px",
                  border: "1px solid #ddd",
                  marginBottom: "20px",
                }}
              />

              {/* <img
     src={`http://localhost:5001/video_feed?ts=${Date.now()}`}
     alt="Live Detector Feed"
     style={{
    width: "100%",
    maxWidth: "520px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    marginBottom: "20px",
    }}
  /> */}


              {/* Dashboard moved to Home Page per user request */}
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


        {showBlockedPopup && (
          <div style={blockedStyles.overlay}>
            <div style={blockedStyles.popup}>
              <h2 style={blockedStyles.title}>⚠️ Access Blocked</h2>
              <p style={blockedStyles.message}>
                {blockedTitle || "This video is not allowed because it is not study-related."}
              </p>

              <button
                onClick={() => setShowBlockedPopup(false)}
                style={blockedStyles.button}
              >
                Go Back
              </button>
            </div>
          </div>
        )}


        {coinsLoaded && appState.coins === 0 && (
          <div style={styles.popup}>
            <div style={{ ...styles.popupInner, border: "2px solid #f59e0b" }}>
              <h3 style={{ ...styles.popupTitle, color: "#d97706" }}>
                ⚠️ You’re out of coins!
              </h3>

              <p style={styles.popupText}>
                Upgrade to <strong>Premium</strong> to continue watching videos and using focus mode.
              </p>

              <div style={{
                fontSize: "1.4em",
                fontWeight: "700",
                margin: "10px 0",
                color: "#111",
              }}>
                💎 Premium – <span style={{ color: "#16a34a" }}>₹299</span>
              </div>

              <button
                onClick={purchasePremium}
                style={{
                  ...styles.button,
                  background: "#16a34a",
                  width: "100%",
                  padding: "12px",
                  fontSize: "1.1em",
                }}
              >
                Unlock Premium for ₹299
              </button>


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


        {/* ================== PERMANENT NOTES PANEL ================== */}
        {/* ================== STICKY NOTE STYLE NOTES PANEL ================== */}
        <div style={stickyNotes.panel}>

          <h3 style={stickyNotes.heading}>
            <span style={stickyNotes.icon}>📌</span> Saved Notes
          </h3>

          {!currentActiveVideoIdentifier ? (
            <p style={stickyNotes.emptyMsg}>Load a video to view saved notes.</p>
          ) : (() => {
            const existing = appState.notes?.[currentActiveVideoIdentifier] || "";
            const cumulative = (existing ? existing + (noteText.trim() ? "\n" + noteText : "") : noteText).trim();

            if (!cumulative) return <p style={stickyNotes.emptyMsg}>No notes saved yet for this video. Add one! ✨</p>;

            return (
              <div style={stickyNotes.stickyCard}>
                <div style={stickyNotes.pin}></div>
                <div style={stickyNotes.noteText}>{cumulative}</div>
                {appState.tags?.[currentActiveVideoIdentifier] && (
                  <div style={stickyNotes.tag}>#{appState.tags[currentActiveVideoIdentifier]}</div>
                )}
                <div style={stickyNotes.date}>
                  Last updated: <strong>{new Date().toLocaleString()}</strong>
                </div>
              </div>
            );
          })()}

        </div>
        {/* ================================================================== */}



        {/* Stats & History */}
        <div style={styles.panel}>
          <h3 style={styles.sectionTitle}>📊 Monthly Study Performance</h3>

          {/* Month selector */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{ padding: "8px 10px", borderRadius: 8 }}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>

            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ width: 100, padding: "8px 10px", borderRadius: 8 }}
            />

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button
                onClick={() => setMonthStartIndex((s) => Math.max(0, s - 10))}
                style={{ padding: "6px 10px", fontSize: 14 }}
              >
                ◀ Prev 10
              </button>
              <button
                onClick={() => setMonthStartIndex((s) => Math.min(Math.max(0, monthData.length - 10), s + 10))}
                style={{ padding: "6px 10px", fontSize: 14 }}
              >
                Next 10 ▶
              </button>
            </div>
          </div>

          {/* Info - swipe/trackpad to move by 10 days */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: "#6b7280" }}>
              Showing {monthData.length ? monthData[Math.min(monthStartIndex, monthData.length - 1)].label : "—"}
              {" "}to{" "}
              {monthData.length ? monthData[Math.min(monthStartIndex + 9, monthData.length - 1)].label : "—"}
            </span>
            <span style={{ marginLeft: "auto", color: "#9ca3af", fontSize: 13 }}>
            </span>
          </div>

          {/* Chart area listens for wheel/touch to change frame by 10 days */}
          <div
            onWheel={handleWheelNav}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            style={{ height: 320, marginTop: "8px", touchAction: "pan-y", cursor: "grab" }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData.slice(monthStartIndex, monthStartIndex + 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="label" tick={{ fill: "#4b5563" }} />
                {/* <YAxis tick={{ fill: "#4b5563" }} /> */}
                <YAxis
                  domain={[0, 1440]}
                  ticks={[0, 180, 360, 540, 720, 900, 1080, 1260, 1440]}
                  tickFormatter={(v) => {
                    const hours = v / 60;
                    return hours === 0 ? "0" : `${hours}h`;
                  }}
                  tick={{ fill: "#4b5563" }}
                  interval={0}
                />

                <Tooltip contentStyle={styles.tooltip} />
                <Bar dataKey="mins" fill="url(#colorUv)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🎬 History Section - Compact Dashboard Widgets */}
        {/* ✅ IMPORTANT: This section shows ONLY the last 5 sessions (sliced). */}
        {/* The graph above uses ALL sessions from the database (unsliced). */}
        <div style={styles.panel}>
          <h3 style={styles.sectionTitle}>🎬 Last 5 Study Sessions</h3>

          {(appState.history || []).length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>No recent study sessions found.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
              {/* ✅ Only show last 5 sessions in cards - graph above uses ALL sessions */}
              {(appState.history || []).slice(0, 5).map((h, i) => {
                const seconds = h.seconds || h.secondsWatched || 0;
                const minutes = Math.floor(seconds / 60);
                const secs = seconds % 60;
                const displayDuration = minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
                const switches = h.tabSwitches || 0;

                const watchDate = h.watchedAt
                  ? h.watchedAt.includes("T")
                    ? new Date(h.watchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : h.watchedAt
                  : "N/A";

                return (
                  <div
                    key={i}
                    style={{
                      background: "#ffffff",
                      borderRadius: "10px",
                      padding: "12px",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                      border: "1px solid #e5e7eb",
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 3px 8px rgba(0, 0, 0, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.08)";
                    }}
                  >
                    {/* Title */}
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", fontWeight: "600", color: "#1f2937", wordBreak: "break-word" }}>
                      <a
                        href={h.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#4f46e5",
                          textDecoration: "none",
                          fontSize: "0.85rem",
                          display: "block",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {h.videoId}
                      </a>
                    </h4>

                    {/* Stats Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      <div>
                        <p style={{ margin: "0 0 2px 0", fontSize: "0.7rem", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase" }}>
                          Duration
                        </p>
                        <p style={{ margin: "0", fontSize: "0.85rem", fontWeight: "700", color: "#059669" }}>
                          {displayDuration}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: "0 0 2px 0", fontSize: "0.7rem", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase" }}>
                          Switches
                        </p>
                        <p style={{ margin: "0", fontSize: "0.85rem", fontWeight: "700", color: switches > 0 ? "#dc2626" : "#6b7280" }}>
                          {switches}
                        </p>
                      </div>
                    </div>

                    {/* Date */}
                    <p style={{ margin: "0 0 8px 0", fontSize: "0.75rem", color: "#9ca3af" }}>
                      {watchDate}
                    </p>

                    {/* Tag & Note */}
                    <div style={{ marginTop: "auto" }}>
                      {h.tag && (
                        <div style={{ marginBottom: "8px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              background: "#f0f4ff",
                              color: "#4f46e5",
                              padding: "3px 8px",
                              borderRadius: "5px",
                              fontSize: "0.7rem",
                              fontWeight: "600",
                              whiteSpace: "nowrap",
                            }}
                          >
                            #{h.tag}
                          </span>
                        </div>
                      )}
                      {(h.note || h.notes) && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const actualNote = h.note || h.notes;
                            setSelectedNote(actualNote);
                            setShowNoteModal(true);
                          }}
                          style={{
                            width: "100%",
                            padding: "6px 12px",
                            backgroundColor: "#f0f4ff",
                            border: "1px solid #c7d2fe",
                            borderRadius: "5px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            color: "#4f46e5",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            marginBottom: "6px"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#e0e7ff";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#f0f4ff";
                          }}
                        >
                          📝 View Note
                        </button>
                      )}

                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const actualNote = h.note || h.notes;
                            generateNotePDF(actualNote, `note-${h.videoId}-${i}`, 'view');
                          }}
                          disabled={!(h.note || h.notes)}
                          style={{
                            flex: 1,
                            padding: "6px 4px",
                            backgroundColor: (h.note || h.notes) ? "#f0f4ff" : "#f9fafb",
                            border: `1px solid ${(h.note || h.notes) ? "#c7d2fe" : "#e5e7eb"}`,
                            borderRadius: "5px",
                            fontSize: "0.65rem",
                            fontWeight: "600",
                            color: (h.note || h.notes) ? "#4f46e5" : "#9ca3af",
                            cursor: (h.note || h.notes) ? "pointer" : "not-allowed",
                          }}
                        >
                          📄 View PDF
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const actualNote = h.note || h.notes;
                            generateNotePDF(actualNote, `note-${h.videoId}-${i}`, 'download');
                          }}
                          disabled={!(h.note || h.notes)}
                          style={{
                            flex: 1,
                            padding: "6px 4px",
                            backgroundColor: (h.note || h.notes) ? "#f0f4ff" : "#f9fafb",
                            border: `1px solid ${(h.note || h.notes) ? "#c7d2fe" : "#e5e7eb"}`,
                            borderRadius: "5px",
                            fontSize: "0.65rem",
                            fontWeight: "600",
                            color: (h.note || h.notes) ? "#4f46e5" : "#9ca3af",
                            cursor: (h.note || h.notes) ? "pointer" : "not-allowed",
                          }}
                        >
                          📥 Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>




      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "10000",
            padding: "20px",
          }}
          onClick={() => setShowNoteModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: "0", fontSize: "1.1rem", fontWeight: "700", color: "#1f2937" }}>
                📝 Study Note
              </h3>
              <button
                onClick={() => setShowNoteModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  padding: "0",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6b7280",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#111827")}
                onMouseLeave={(e) => (e.target.style.color = "#6b7280")}
              >
                ✕
              </button>
            </div>

            {/* Content - Scrollable */}
            <div
              style={{
                flex: "1",
                overflowY: "auto",
                padding: "20px",
                fontSize: "0.95rem",
                lineHeight: "1.6",
                color: "#374151",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {selectedNote}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  generateNotePDF(selectedNote, `note-${Date.now()}`, 'view');
                }}
                disabled={!selectedNote}
                style={{
                  padding: "8px 16px",
                  backgroundColor: selectedNote ? "#f0f4ff" : "#f9fafb",
                  border: `1px solid ${selectedNote ? "#c7d2fe" : "#e5e7eb"}`,
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: selectedNote ? "#4f46e5" : "#9ca3af",
                  cursor: selectedNote ? "pointer" : "not-allowed",
                }}
              >
                📄 View PDF
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  generateNotePDF(selectedNote, `note-${Date.now()}`, 'download');
                }}
                disabled={!selectedNote}
                style={{
                  padding: "8px 16px",
                  backgroundColor: selectedNote ? "#10b981" : "#f9fafb",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  color: selectedNote ? "#ffffff" : "#9ca3af",
                  cursor: selectedNote ? "pointer" : "not-allowed",
                }}
              >
                📥 Download PDF
              </button>
              <button
                onClick={() => setShowNoteModal(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  color: "#111827",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

// Basic styles to make the component runnable
const styles = {

  page: { background: '#f3f4f6', width: '100vw', minHeight: '100vh', padding: '24px', boxSizing: 'border-box', fontFamily: 'sans-serif' },
  container: { width: '100%', maxWidth: '100%', margin: '0', display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: {
    fontSize: "2.5rem",
    fontWeight: "800",
    background: "linear-gradient(to right, #6366f1, #ec4899)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: 0,
    fontFamily: "'Inter', sans-serif",
  },
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
  player: { position: 'relative', width: '100%', height: '70vh', background: '#000' },
  playerMax: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 200, background: '#000' },
  toggleMaxMinButton: { position: 'absolute', bottom: '10px', right: '10px', zIndex: 210, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' },
  controlsAndStats: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' },
  statsText: { display: 'flex', gap: '24px', color: '#4b5563' },
  textarea: {
    width: '100%',
    height: '200px',          // ✅ fixed bigger height
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '1.05em',
    resize: 'none',           // ✅ size fixed rahe
    overflowY: 'auto',        // ✅ andar scroll
    lineHeight: '1.6',
  },

  placeholder: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', background: '#f9fafb', borderRadius: '8px', color: '#6b7280' },
  tooltip: { background: '#fff', border: '1px solid #d1d5db', padding: '8px', borderRadius: '8px' },
  warningBanner: {
    position: "fixed",
    top: 12,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#111827",
    color: "white",
    padding: "10px 16px",
    borderRadius: "12px",
    fontWeight: "600",
    zIndex: 99999,
    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
  },

};


const blockedStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },

  popup: {
    background: "rgba(255,255,255,0.95)",
    padding: "24px",
    width: "90%",
    maxWidth: "380px",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    textAlign: "center",
  },

  title: {
    fontSize: "1.5em",
    fontWeight: "700",
    color: "#dc2626",
    marginBottom: "10px",
  },

  message: {
    fontSize: "1em",
    color: "#374151",
    lineHeight: "1.5",
    marginBottom: "20px",
  },

  button: {
    padding: "10px 20px",
    background: "#4f46e5",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
    border: "none",
    fontSize: "1em",
    width: "100%",
  },
};


const stylesNotes = {
  panel: {
    background: "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)",
    padding: "22px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
  },

  heading: {
    fontSize: "1.4rem",
    fontWeight: "700",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#1f2937",
  },

  icon: {
    fontSize: "1.4em",
  },

  emptyMsg: {
    color: "#6b7280",
    fontSize: "0.95em",
    padding: "6px 0",
  },

  noteCard: {
    padding: "18px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.65)",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
  },

  noteText: {
    fontSize: "1rem",
    color: "#111827",
    lineHeight: "1.6",
    marginBottom: "12px",
    whiteSpace: "pre-wrap",
  },

  tag: {
    display: "inline-block",
    background: "#e0e7ff",
    padding: "6px 12px",
    borderRadius: "8px",
    color: "#3730a3",
    fontWeight: "600",
    fontSize: "0.85rem",
    marginBottom: "12px",
    boxShadow: "0px 3px 8px rgba(88, 80, 255, 0.25)",
  },

  divider: {
    height: "1px",
    background: "#e5e7eb",
    margin: "14px 0",
  },

  date: {
    fontSize: "0.85rem",
    color: "#6b7280",
  },
};

const stickyNotes = {
  panel: {
    background: "#fff",
    padding: "22px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
  },

  heading: {
    fontSize: "1.4rem",
    fontWeight: "700",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#1f2937",
  },

  icon: {
    fontSize: "1.4em",
  },

  emptyMsg: {
    color: "#6b7280",
    fontSize: "0.95em",
    padding: "6px 0",
  },

  stickyCard: {
    position: "relative",
    background: "#fff8a8",
    padding: "20px",
    height: "600px",          // ✅ fixed height
    width: "100%",
    borderRadius: "10px",
    fontFamily: "'Patrick Hand', cursive, sans-serif",
    fontSize: "1.1rem",
    color: "#374151",
    lineHeight: "1.6",

    // Scrollable content
    overflowY: "auto",        // ✅ scroll inside
    overflowX: "hidden",

    // Sticky note shadow + tilt
    boxShadow: "0 10px 18px rgba(0,0,0,0.12)",
    transform: "rotate(-1.5deg)",
  },


  // Red pin on top center
  pin: {
    width: "18px",
    height: "18px",
    background: "#ef4444",
    borderRadius: "50%",
    position: "absolute",
    top: "-8px",
    left: "50%",
    transform: "translateX(-50%)",
    boxShadow: "0 3px 6px rgba(0,0,0,0.3)",
  },

  noteText: {
    marginBottom: "12px",
  },

  tag: {
    display: "inline-block",
    background: "#fde047",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: "600",
    boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
    marginBottom: "10px",
  },

  date: {
    marginTop: "12px",
    color: "#6b7280",
    fontSize: "0.85rem",
  },
};
