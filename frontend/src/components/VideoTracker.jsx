import React, { useEffect, useRef, useState } from "react";
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

// --- VIDEO TRACKER COMPONENT ---

export default function VideoTracker() {
  // App state
  const [appState, setAppState] = useState(() => loadState());
  const [inputUrl, setInputUrl] = useState("");
  const [videoId, setVideoId] = useState(null);
  const [localVideoFile, setLocalVideoFile] = useState(null);
  const [localVideoObjectUrl, setLocalVideoObjectUrl] = useState(null);

  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [sessionPlayedSeconds, setSessionPlayedSeconds] = useState(0);
  const [sessionViewsTaken, setSessionViewsTaken] = useState(0);
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

  // NEW REFS FOR CAMERA
  const cameraVideoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const socketRef = useRef(null);


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

    const socket = io("http://localhost:5000");
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

  // Tab switch handling
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && isPlaying) {
        setSessionViewsTaken((v) => v + 1);
        if (focusRemaining && focusRemaining > 0) {
          setAppState((prev) => ({
            ...prev,
            coins: Math.max(0, (prev.coins || 0) - TAB_SWITCH_COST),
          }));
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () =>
      document.removeEventListener("visibilitychange", onVisibility);
  }, [isPlaying, focusRemaining]);

  // Finalize session logic
  const finalizeSession = (ended = false) => {
    const currentVideoIdentifier = videoId || localVideoFile?.name;
    if (!currentVideoIdentifier) return;
    const secondsWatched = Math.floor(sessionPlayedSeconds);
    if (secondsWatched <= 0 && sessionViewsTaken === 0) {
      cleanupAfterSession();
      return;
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
      }

      const notes = { ...(prev.notes || {}) };
      if (noteText) notes[currentVideoIdentifier] = noteText;
      const history = [...(prev.history || []), newHistoryEntry];

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

  // Cleanup after session
  const cleanupAfterSession = (ended = false) => {
    try {
      if (videoId && youtubePlayerRef.current) {
        youtubePlayerRef.current.pauseVideo();
        if (ended) {
          youtubePlayerRef.current.stopVideo();
          youtubePlayerRef.current.destroy();
          youtubePlayerRef.current = null;
        }
      } else if (localVideoRef.current) {
        localVideoRef.current.pause();
        if (ended) {
          localVideoRef.current.currentTime = 0;
        }
      }
    } catch (e) {}

    setVideoId(null);
    setLocalVideoFile(null);
    setYoutubePlayerInstance(null);
    setIsPlaying(false);
    setSessionPlayedSeconds(0);
    setSessionViewsTaken(0);
    setCurrentTime(0);
    stopPolling();
    setFocusRemaining(null);
    setFocusDuration(null);
    setIsFocusTimerPending(false);
    setHasPlaybackStarted(false);
    setIsFocusTimerPopupMaximized(false);
  };

  // Event Handlers
  const handleLoadContent = () => {
    if (appState.coins <= 0) {
      setShowZeroCoinsPopup(true);
      return;
    }
    if (inputUrl.trim()) {
      const id = extractYouTubeId(inputUrl.trim());
      if (!id) {
        alert("Please paste a valid YouTube URL or ID.");
        return;
      }
      setLocalVideoFile(null);
      setVideoId(id);
    } else if (localVideoFile) {
      setVideoId(null);
    } else {
      alert("Please paste a YouTube URL or select a local video file.");
      return;
    }
    setShowTimerPopup(true);
    setInputUrl("");
    setIsFocusTimerPopupMaximized(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLocalVideoFile(file);
      setInputUrl("");
    }
  };

  const confirmStartFocus = () => {
    setFocusDuration(focusMinutes * 60);
    setIsFocusTimerPending(true);
    setShowTimerPopup(false);
  };

  const handleStopSave = () => finalizeSession(false);

  const handleSaveNotes = () => {
    const currentVideoIdentifier = videoId || localVideoFile?.name;
    if (!currentVideoIdentifier) return alert("Load a video first");
    setAppState((prev) => ({
      ...prev,
      notes: { ...(prev.notes || {}), [currentVideoIdentifier]: noteText },
    }));
    alert("Notes saved locally");
  };

  const purchasePremium = () => {
    if (!window.confirm("Purchase Premium (demo): add 100 coins?")) return;
    setAppState((prev) => ({ ...prev, coins: (prev.coins || 0) + 100 }));
    setShowZeroCoinsPopup(false);
    alert("Premium purchase successful! 100 coins added.");
  };

  const clearHistory = () => {
    if (!window.confirm("Clear all history, stats, and notes?")) return;
    setAppState({
      history: [],
      notes: {},
      stats: {},
      coins: INITIAL_COINS,
      streak: 0,
      lastDayWatched: null,
    });
  };

  // Data computation
  const computeWeeklyStats = (history) => {
    const stats = {};
    history.forEach((h) => {
      const key = new Date(h.watchedAt).toLocaleDateString();
      stats[key] = (stats[key] || 0) + Math.floor(h.seconds / 60);
    });
    setWeeklyStats(stats);
  };

  const computeLastFiveDays = (history) => {
    const fiveDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 5;
    const recent = history.filter(
      (h) => new Date(h.watchedAt).getTime() >= fiveDaysAgo
    );
    recent.sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
    setLastFiveDays(recent);
  };

  useEffect(() => {
    computeWeeklyStats(appState.history);
    computeLastFiveDays(appState.history);
  }, []);

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
                <button onClick={confirmStartFocus} style={{ ...styles.button, fontSize: isFocusTimerPopupMaximized ? '1.2em' : '1em' }}>
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
                    Watched:{" "}
                    <strong>{niceTime(sessionPlayedSeconds)}</strong>
                  </div>
                  <div>
                    Tab Switches: <strong>{sessionViewsTaken}</strong>
                  </div>
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