// routes/trackingRoutes.js
import express from "express";
import User from "../models/User.js";
import protect from "../middlewares/authMiddleware.js";
 // ✅ use JWT middleware

const router = express.Router();

// Increment coins (userId comes from token)
router.post("/coins", protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = req.user; // ✅ got from JWT
    if (!user) return res.status(404).json({ message: "User not found" });

    user.coins = (user.coins || 0) + (amount || 1);
    await user.save();
    res.json({ success: true, coins: user.coins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Increment videos watched + maintain streak
// ✅ Increment videos watched + maintain streak
router.post("/videos-watched", protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: "User not found" });

    // Get today & last watched date
    const today = new Date();
    const todayDate = today.toDateString();
    const lastWatchedDate = user.lastDayWatched ? new Date(user.lastDayWatched).toDateString() : null;

    // ✅ Increment total videos watched
    user.videosWatched = (user.videosWatched || 0) + 1;

    // ✅ Streak logic
    if (!lastWatchedDate) {
      // first time
      user.streak = 1;
    } else if (lastWatchedDate === todayDate) {
      // same day → streak stays same
    } else {
      const diffDays = Math.floor((today - new Date(user.lastDayWatched)) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        // watched next day → increment streak
        user.streak = (user.streak || 0) + 1;
      } else {
        // missed one or more days → reset streak
        user.streak = 1;
      }
    }

    // ✅ Update last watched date
    user.lastDayWatched = today;

    // ✅ Save changes
    await user.save();

    res.json({
      success: true,
      videosWatched: user.videosWatched,
      streak: user.streak,
      lastDayWatched: user.lastDayWatched,
    });
  } catch (err) {
    console.error("⚠️ Error updating videos watched:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});



// Reduce coins when user switches tab
router.post("/coins-loss", protect, async (req, res) => {
  try {
    const { loss = 1 } = req.body;
    const user = req.user;

    if (!user) return res.status(404).json({ message: "User not found" });

    user.coins = Math.max(0, (user.coins || 0) - loss); // never negative
    user.videosSwitched = (user.videosSwitched || 0) + 1;

    await user.save();

    res.json({
      success: true,
      message: `Coins reduced by ${loss}`,
      coins: user.coins,
      videosSwitched: user.videosSwitched,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/coins-gain", async (req, res) => {
  try {
    const { userId, gain } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.coins += gain;
    await user.save();

    res.json({ success: true, coins: user.coins });
  } catch (err) {
    console.error("Error in coins-gain:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// Get user stats
router.get("/stats", protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      coins: user.coins,
      videosWatched: user.videosWatched,
      videosSwitched: user.videosSwitched,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🪙 Fetch user coins by ID (for frontend coin sync)
router.get("/coins/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ coins: user.coins });
  } catch (err) {
    console.error("Error fetching coins:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Add video watch history (keeps last 5 days)
// router.post("/add-history", protect, async (req, res) => {
//   try {
//     const { videoId, url, secondsWatched, tabSwitches } = req.body;
//     const user = req.user;
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // create history entry
//     const newEntry = {
//       videoId,
//       url,
//       secondsWatched: secondsWatched || 0,
//       tabSwitches: tabSwitches || 0,
//       watchedAt: new Date(),
//     };

//     // push new entry
//     user.history.push(newEntry);

//     // only keep last 5 entries
//     if (user.history.length > 5) {
//       user.history = user.history.slice(-5);
//     }

//     await user.save();

//     res.json({ success: true, history: user.history });
//   } catch (err) {
//     console.error("⚠️ Error adding history:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });


router.post("/add-history", protect, async (req, res) => {
  try {
    const user = req.user;
    const { videoId, url, secondsWatched, tabSwitches } = req.body;

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // 🚫 Don’t save empty sessions
    if (!secondsWatched || secondsWatched < 5) {
      return res.json({ success: false, message: "Session too short, not saved" });
    }

    const newEntry = {
      videoId,
      url,
      secondsWatched: Math.round(secondsWatched),
      tabSwitches: tabSwitches || 0,
      watchedAt: new Date(),
    };

    // ✅ Keep full history in DB
    user.history.unshift(newEntry);
    await user.save();

    const latestFive = user.history.slice(0, 5);
    res.json({ success: true, history: latestFive });
  } catch (err) {
    console.error("❌ Error adding history:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ✅ Get last 5 video history entries
router.get("/history", protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Send last 5 (newest first)
    const recentHistory = (user.history || []).slice(0, 5);

    res.json({ success: true, history: recentHistory });
  } catch (err) {
    console.error("⚠️ Error fetching history:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Weekly stats: total minutes watched in last 7 days
// 📊 Weekly study performance (past 7 days)
router.get("/weekly-stats", protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const pastWeek = new Date(now);
    pastWeek.setDate(now.getDate() - 6);

    // Filter user history for last 7 days
    const recentHistory = (user.history || []).filter(
      (entry) => new Date(entry.watchedAt) >= pastWeek
    );

    // Group by date
    const stats = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(pastWeek);
      date.setDate(pastWeek.getDate() + i);
      const key = date.toISOString().split("T")[0];
      stats[key] = 0;
    }

    recentHistory.forEach((entry) => {
      const dateKey = new Date(entry.watchedAt).toISOString().split("T")[0];
      if (stats[dateKey] !== undefined) {
        stats[dateKey] += Math.round(entry.secondsWatched / 60); // convert to minutes
      }
    });

    res.json({ success: true, stats });
  } catch (err) {
    console.error("⚠️ Error fetching weekly stats:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


router.get("/dashboard", protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      success: true,
      coins: user.coins,
      videosWatched: user.videosWatched,
      videosSwitched: user.videosSwitched,
      streak: user.streak,
      history: user.history.slice(-5).reverse(), // last 5 sessions
    });
  } catch (err) {
    console.error("⚠️ Error fetching dashboard:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📅 Get 30-day activity for dashboard
router.get("/monthly-activity", protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: "User not found" });

    // Group by date
    const activity = {};
    user.history.forEach((session) => {
      const date = new Date(session.watchedAt).toISOString().split("T")[0];
      if (!activity[date]) activity[date] = { totalSeconds: 0 };
      activity[date].totalSeconds += session.secondsWatched || 0;
    });

    res.json({ success: true, activity });
  } catch (err) {
    console.error("⚠️ Error fetching monthly activity:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});



export default router;
