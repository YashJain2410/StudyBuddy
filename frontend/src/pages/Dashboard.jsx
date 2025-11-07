import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext"; // 👈 import your context
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { eachDayOfInterval, format, startOfMonth, endOfMonth } from "date-fns";

const Dashboard = () => {
  const { appState } = useAppContext();
  const { user, coins, streak, history } = appState;

  const [monthlyActivity, setMonthlyActivity] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchMonthlyActivity = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found, skipping monthly activity fetch");
      return;
    }

    const res = await fetch("/api/tracking/monthly-activity", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error("Failed to fetch activity:", data.message);
      return;
    }

    console.log("✅ Monthly activity:", data.activity);
    setMonthlyActivity(data.activity);
    localStorage.setItem("monthlyActivity", JSON.stringify(data.activity));
  } catch (err) {
    console.error("Error fetching monthly activity:", err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    const cached = localStorage.getItem("monthlyActivity");
    if (cached) {
      try {
        setMonthlyActivity(JSON.parse(cached));
      } catch {}
    }
    fetchMonthlyActivity();
  }, []);

  if (!user) return <p>Please log in to view your dashboard.</p>;
  if (loading) return <p className="text-gray-400 text-center mt-10">Loading your dashboard...</p>;

  // 🔹 Convert backend data for chart
  const chartData = Object.entries(monthlyActivity).map(([date, val]) => ({
    date: format(new Date(date), "MMM d"),
    hours: (val.totalSeconds / 3600).toFixed(2),
  }));

  // 🔹 Calendar (this month)
  const now = new Date();
  const days = eachDayOfInterval({
    start: startOfMonth(now),
    end: endOfMonth(now),
  });

  return (
    <div className="bg-[#111827] min-h-screen text-white p-6 md:p-10 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-[#4B73FF]">
        Welcome back, {user?.name || "Learner"} 👋
      </h1>

      {/* 🔸 Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Coins" value={coins} icon="🪙" />
        <StatCard title="Videos Watched" value={user?.videosWatched || 0} icon="🎬" />
        <StatCard title="Tab Switches" value={user?.videosSwitched || 0} icon="🔁" />
        <StatCard title="Streak" value={`${streak} days`} icon="🔥" />
      </div>

      {/* 🔸 Weekly Chart */}
      <div className="bg-[#1F2937] p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-300">
          Study Hours (Last 30 Days)
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 10 }} interval={4} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="hours" fill="#4B73FF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🔸 Calendar */}
      <div className="bg-[#1F2937] p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-300">
          Study Activity — {format(now, "MMMM yyyy")}
        </h2>
        <div className="grid grid-cols-7 gap-2 text-center">
          {days.map((day, i) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const activity = monthlyActivity[dateKey];
            const bg =
              activity && activity.totalSeconds > 0
                ? "bg-green-500"
                : "bg-gray-700";
            return (
              <div
                key={i}
                className={`p-2 rounded-md text-sm font-medium ${bg}`}
              >
                {format(day, "d")}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔸 Last 5 Study Sessions */}
      <div className="bg-[#1F2937] p-6 rounded-xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-300">
          🎬 Last 5 Study Sessions
        </h2>
        {history.length === 0 ? (
          <p className="text-gray-400">No recent study sessions found.</p>
        ) : (
          history.map((h, i) => (
            <div
              key={i}
              className="bg-[#111827] p-3 mb-3 rounded-lg border border-gray-700"
            >
              <p>
                <b>Video:</b>{" "}
                <a
                  href={h.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400"
                >
                  {h.videoId}
                </a>
              </p>
              <p>
                <b>Watched:</b>{" "}
                {h.secondsWatched >= 60
                  ? `${Math.floor(h.secondsWatched / 60)}m ${h.secondsWatched % 60}s`
                  : `${h.secondsWatched}s`}
              </p>
              <p>
                <b>Tab Switches:</b> {h.tabSwitches}
              </p>
              <p>
                <b>Date:</b> {new Date(h.watchedAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 🔸 Reusable Stat Card Component
const StatCard = ({ title, value, icon }) => (
  <div className="bg-[#1F2937] p-4 rounded-lg text-center shadow-sm">
    <div className="text-2xl mb-2">{icon}</div>
    <h3 className="text-gray-400 text-sm">{title}</h3>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

export default Dashboard;
