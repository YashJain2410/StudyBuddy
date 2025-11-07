// import React, { useState, useEffect } from "react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   Legend,
// } from "recharts";

// const AssignmentCard = () => {
//   // State for data
//   const [assignments, setAssignments] = useState([]);
//   const [hackathons, setHackathons] = useState([]);
//   const [reminders, setReminders] = useState([]);

//   // State for UI and settings
//   const [coins, setCoins] = useState(() => parseInt(localStorage.getItem("assignment_coins")) || 100);
//   const [tabSwitches, setTabSwitches] = useState(() => parseInt(localStorage.getItem("assignment_tabSwitches")) || 0);
//   const [darkMode, setDarkMode] = useState(false);
//   const [filter, setFilter] = useState("All");
//   const [currentTime, setCurrentTime] = useState(new Date());

//   // State for input forms (controlled components)
//   const [newAssignment, setNewAssignment] = useState({ title: "", deadline: "" });
//   const [newHackathon, setNewHackathon] = useState({ title: "", date: "", platform: "", link: "" });
//   const [newReminder, setNewReminder] = useState({ title: "", time: "" });

//   // --- SIDE EFFECTS (useEffect) ---

//   // Save coins & tabSwitches to localStorage
//   useEffect(() => {
//     localStorage.setItem("assignment_coins", coins);
//     localStorage.setItem("assignment_tabSwitches", tabSwitches);
//   }, [coins, tabSwitches]);

//   // Tab switch detection logic
//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       if (document.hidden) {
//         setTabSwitches((prevSwitches) => {
//           const newSwitches = prevSwitches + 1;
//           if (newSwitches > 5) {
//             if (coins >= 10) {
//               setCoins((prevCoins) => prevCoins - 10);
//               alert(`⚠️ Tab switched! -10 coins deducted`);
//             } else {
//               alert("🚫 No coins left! Stay on this tab.");
//               return prevSwitches; // Don't increment if no coins
//             }
//           } else {
//             alert(`⚠️ Tab switched! (${newSwitches}/5 free)`);
//           }
//           return newSwitches;
//         });
//       }
//     };
//     document.addEventListener("visibilitychange", handleVisibilityChange);
//     return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
//   }, [coins]); // Re-check coins value if it changes

//   // Timer to update countdowns every second
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // --- HELPER FUNCTIONS ---

//   const getTimeRemaining = (deadline) => {
//     const total = Date.parse(deadline) - currentTime.getTime();
//     if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
//     const seconds = Math.floor((total / 1000) % 60);
//     const minutes = Math.floor((total / 1000 / 60) % 60);
//     const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
//     const days = Math.floor(total / (1000 * 60 * 60 * 24));
//     return { total, days, hours, minutes, seconds };
//   };

//   // --- EVENT HANDLERS ---

//   const handleAddAssignment = () => {
//     if (!newAssignment.title || !newAssignment.deadline) return;
//     setAssignments(prev => [...prev, { ...newAssignment, id: Date.now(), status: "Pending" }]);
//     setNewAssignment({ title: "", deadline: "" });
//   };

//   const handleAddHackathon = () => {
//     if (!newHackathon.title || !newHackathon.date) return;
//     setHackathons(prev => [...prev, { ...newHackathon, id: Date.now(), status: "Pending" }]);
//     setNewHackathon({ title: "", date: "", platform: "", link: "" });
//   };

//   const handleAddReminder = () => {
//     if (!newReminder.title || !newReminder.time) return;
//     setReminders(prev => [...prev, { ...newReminder, id: Date.now() }]);
//     setNewReminder({ title: "", time: "" });
//   };

//   const toggleStatus = (id, type) => {
//     const updater = (item) => item.id === id ? { ...item, status: item.status === "Pending" ? "Completed" : "Pending" } : item;
//     if (type === "assignment") {
//       setAssignments(prev => prev.map(updater));
//     } else if (type === "hackathon") {
//       setHackathons(prev => prev.map(updater));
//     }
//   };

//   const removeReminder = (id) => {
//     setReminders(prev => prev.filter(r => r.id !== id));
//   };


//   // --- DERIVED DATA for Rendering ---

//   const graphData = [
//     {
//       name: "Assignments",
//       Completed: assignments.filter((a) => a.status === "Completed").length,
//       Pending: assignments.filter((a) => a.status === "Pending").length,
//     },
//     {
//       name: "Hackathons",
//       Completed: hackathons.filter((h) => h.status === "Completed").length,
//       Pending: hackathons.filter((h) => h.status === "Pending").length,
//     },
//   ];

//   const filteredAssignments = assignments.filter(a => filter === "All" || a.status === filter);
//   const filteredHackathons = hackathons.filter(h => filter === "All" || h.status === filter);

//   // --- JSX RENDER ---

//   return (
//     <div className={darkMode ? 'dark-mode' : ''}>
//       <div className="header">
//         <h1>📚 Assignment & Hackathon Tracker</h1>
//         <button id="darkModeToggle" className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)}>
//           {darkMode ? "Light Mode" : "Dark Mode"}
//         </button>
//       </div>

//       <div className="status-section">
//         <span className="coins">🪙 {coins} Coins</span>
//         <span className="switches">🔄 {tabSwitches}/5 Free</span>
//       </div>

//       <div className="filter-section">
//         <button className={filter === 'All' ? 'active-filter' : 'inactive-filter'} onClick={() => setFilter('All')}>All</button>
//         <button className={filter === 'Pending' ? 'active-filter' : 'inactive-filter'} onClick={() => setFilter('Pending')}>Pending</button>
//         <button className={filter === 'Completed' ? 'active-filter' : 'inactive-filter'} onClick={() => setFilter('Completed')}>Completed</button>
//       </div>

//       <div className="add-card">
//         <h2>📝 Add Assignment</h2>
//         <input type="text" placeholder="Assignment Title" value={newAssignment.title} onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}/>
//         <input type="datetime-local" value={newAssignment.deadline} onChange={(e) => setNewAssignment({...newAssignment, deadline: e.target.value})}/>
//         <button onClick={handleAddAssignment}>Add Assignment</button>
//       </div>

//       <div className="add-card">
//         <h2>🏆 Add Hackathon</h2>
//         <input type="text" placeholder="Hackathon Title" value={newHackathon.title} onChange={(e) => setNewHackathon({...newHackathon, title: e.target.value})} />
//         <input type="date" value={newHackathon.date} onChange={(e) => setNewHackathon({...newHackathon, date: e.target.value})} />
//         <input type="text" placeholder="Platform" value={newHackathon.platform} onChange={(e) => setNewHackathon({...newHackathon, platform: e.target.value})} />
//         <input type="text" placeholder="Link" value={newHackathon.link} onChange={(e) => setNewHackathon({...newHackathon, link: e.target.value})} />
//         <button onClick={handleAddHackathon}>Add Hackathon</button>
//       </div>

//       <div className="add-card">
//         <h2>⏰ Add Reminder</h2>
//         <input type="text" placeholder="Reminder Title" value={newReminder.title} onChange={(e) => setNewReminder({...newReminder, title: e.target.value})} />
//         <input type="time" value={newReminder.time} onChange={(e) => setNewReminder({...newReminder, time: e.target.value})} />
//         <button onClick={handleAddReminder}>Add Reminder</button>
//       </div>

//       <div className="add-card">
//         <h2>📊 Weekly Stats</h2>
//         <ResponsiveContainer width="100%" height={250}>
//             <BarChart data={graphData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="name" />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 <Bar dataKey="Completed" stackId="a" fill="#4ade80" name="Completed" />
//                 <Bar dataKey="Pending" stackId="a" fill="#facc15" name="Pending" />
//             </BarChart>
//         </ResponsiveContainer>
//       </div>

//       <div style={{ marginBottom: '2rem' }}>
//         <h2>📝 Assignments</h2>
//         <div className="item-grid">
//             {filteredAssignments.map(a => {
//                 const remaining = getTimeRemaining(a.deadline);
//                 let cloudClass = 'pending-normal';
//                 if (a.status === 'Completed') {
//                     cloudClass = 'completed';
//                 } else if (remaining.total <= 0) {
//                     cloudClass = 'pending-urgent';
//                 } else if (remaining.total < 12 * 60 * 60 * 1000) {
//                     cloudClass = 'pending-warning';
//                 }
//                 return (
//                     <div key={a.id} className={`cloud-item assignment-item ${cloudClass}`}>
//                         <p className="item-title">{a.title}</p>
//                         <p className="item-details">
//                             {remaining.total > 0 ? `${remaining.days}d ${remaining.hours}h ${remaining.minutes}m left` : "Expired"}
//                         </p>
//                         <button className="status-btn" onClick={() => toggleStatus(a.id, 'assignment')}>
//                             {a.status === "Pending" ? "Mark Complete" : "Mark Pending"}
//                         </button>
//                     </div>
//                 );
//             })}
//         </div>
//       </div>
      
//       <div style={{ marginBottom: '2rem' }}>
//         <h2>🏆 Hackathons</h2>
//         <div className="item-grid">
//             {filteredHackathons.map(h => {
//                 const cloudClass = h.status === "Completed" ? 'completed' : 'pending-normal';
//                 return (
//                     <div key={h.id} className={`cloud-item hackathon-item ${cloudClass}`}>
//                          <p className="item-title">{h.title}</p>
//                          <p className="item-details">{new Date(h.date).toLocaleDateString()}</p>
//                          <p className="item-details">{h.platform}</p>
//                          <button className="status-btn" onClick={() => toggleStatus(h.id, 'hackathon')}>
//                              {h.status === "Pending" ? "Mark Complete" : "Mark Pending"}
//                          </button>
//                     </div>
//                 );
//             })}
//         </div>
//       </div>
      
//       <div style={{ marginBottom: '2rem' }}>
//         <h2>⏰ Reminders</h2>
//         <div className="item-grid">
//             {reminders.map(r => {
//                 const now = new Date();
//                 const [hours, minutes] = r.time.split(":").map(Number);
//                 const target = new Date(now);
//                 target.setHours(hours, minutes, 0, 0);
//                 const diff = target - now;
//                 const timeLeft = diff > 0 ? `${Math.floor(diff / 1000 / 60 / 60)}h ${Math.floor((diff / 1000 / 60) % 60)}m left` : "Time Passed";

//                 return(
//                     <div key={r.id} className="cloud-item reminder-item">
//                         <p className="item-title">{r.title}</p>
//                         <p className="item-details">{r.time}</p>
//                         <p className="item-details">{timeLeft}</p>
//                         <button className="status-btn" onClick={() => removeReminder(r.id)}>Dismiss</button>
//                     </div>
//                 );
//             })}
//         </div>
//       </div>

//       <style>{`
//         /* All original CSS is placed here */
//         @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
//         :root {
//             --bg-start-color: #e6e0f0; --bg-end-color: #f0f3f8; --text-color: #333; --card-bg: #fff;
//             --btn-gradient: linear-gradient(to right, #4338ca, #db2777); --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//             --heading-color: #6B57E0; --yellow-200: #fef08a; --green-200: #dcfce7; --red-200: #fecaca; --orange-200: #fed7aa;
//             --cloud-bg-assignment: #f7e6f8; --cloud-bg-hackathon: #e6f8f7; --cloud-bg-reminder: #f8e6f7;
//             --cloud-bg-completed: #dceefc; --cloud-bg-urgent: #fbc2c2; --cloud-bg-warning: #ffe6cc;
//         }
//         body { padding: 2rem; margin: 0; }
//         .app-container { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, var(--bg-start-color), var(--bg-end-color)); color: var(--text-color); min-height: 100vh; }
//         .dark-mode { background: #1f2937; color: #e5e7eb; }
//         .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
//         .header h1 { font-size: 1.875rem; font-weight: 700; color: var(--heading-color); }
//         .dark-mode .header h1 { color: #db2777; }
//         .header .dark-mode-toggle { padding: 0.5rem 1rem; background: var(--btn-gradient); color: white; border: none; border-radius: 0.5rem; box-shadow: var(--box-shadow); cursor: pointer; transition: all 0.2s ease; }
//         .status-section { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; }
//         .status-section span { padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
//         .status-section .coins { background-color: var(--yellow-200); }
//         .status-section .switches { background-color: var(--green-200); }
//         .filter-section { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
//         .filter-section button { padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; font-weight: 600; box-shadow: var(--box-shadow); cursor: pointer; }
//         .filter-section .active-filter { background: var(--btn-gradient); color: white; }
//         .filter-section .inactive-filter { background-color: rgba(255, 255, 255, 0.3); color: #1f2937; }
//         .dark-mode .filter-section .inactive-filter { background: #374151; color: #e5e7eb; }
//         .add-card { margin-bottom: 2rem; padding: 1.5rem; background-color: rgba(255, 255, 255, 0.3); backdrop-filter: blur(8px); border-radius: 1rem; box-shadow: var(--box-shadow); }
//         .dark-mode .add-card { background-color: rgba(31, 41, 55, 0.5); border: 1px solid rgba(255,255,255,0.1); }
//         .add-card h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; }
//         .add-card input { box-sizing: border-box; width: 100%; margin-bottom: 0.5rem; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #ccc; }
//         .dark-mode .add-card input { background-color: #374151; color: #fff; border-color: #4b5563; }
//         .add-card button { padding: 0.75rem 1rem; background: var(--btn-gradient); color: white; border: none; border-radius: 0.5rem; box-shadow: var(--box-shadow); cursor: pointer; }
//         .item-grid { display: flex; flex-wrap: wrap; gap: 2rem; justify-content: flex-start; }
//         .cloud-item { width: 250px; height: 150px; position: relative; padding: 1.5rem; border-radius: 50%; box-shadow: var(--box-shadow); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; cursor: pointer; transition: all 0.3s ease; animation: float-animation 6s ease-in-out infinite; }
//         .cloud-item:hover { transform: translateY(-10px) scale(1.05); }
//         .cloud-item::before, .cloud-item::after { content: ''; position: absolute; background: inherit; border-radius: 50%; z-index: -1; box-shadow: inherit; }
//         .cloud-item::before { width: 100px; height: 100px; top: -50px; left: 25px; }
//         .cloud-item::after { width: 120px; height: 120px; top: -30px; right: 10px; }
//         .cloud-item:nth-child(even) { animation-delay: -3s; }
//         @keyframes float-animation { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
//         .cloud-item.assignment-item { background-color: var(--cloud-bg-assignment); }
//         .cloud-item.hackathon-item { background-color: var(--cloud-bg-hackathon); }
//         .cloud-item.reminder-item { background-color: var(--cloud-bg-reminder); }
//         .cloud-item.completed { background-color: var(--cloud-bg-completed); }
//         .cloud-item.pending-urgent { background-color: var(--cloud-bg-urgent); }
//         .cloud-item.pending-warning { background-color: var(--cloud-bg-warning); }
//         .item-title { font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem; }
//         .item-details { font-size: 0.75rem; color: #4b5563; }
//         .dark-mode .item-details { color: #d1d5db; }
//         .status-btn { margin-top: 0.5rem; padding: 0.25rem 0.75rem; background: var(--btn-gradient); color: white; border: none; border-radius: 0.25rem; cursor: pointer; }
//       `}</style>
//     </div>
//   );
// };

// export default AssignmentCard;

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const AssignmentCard = () => {
  const [assignments, setAssignments] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [reminders, setReminders] = useState([]);

  const [coins, setCoins] = useState(() => parseInt(localStorage.getItem("assignment_coins")) || 100);
  const [tabSwitches, setTabSwitches] = useState(() => parseInt(localStorage.getItem("assignment_tabSwitches")) || 0);
  const [darkMode, setDarkMode] = useState(false);
  const [filter, setFilter] = useState("All");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [newAssignment, setNewAssignment] = useState({ title: "", deadline: "" });
  const [newHackathon, setNewHackathon] = useState({ title: "", date: "", platform: "", link: "" });
  const [newReminder, setNewReminder] = useState({ title: "", time: "" });

  useEffect(() => {
    localStorage.setItem("assignment_coins", coins);
    localStorage.setItem("assignment_tabSwitches", tabSwitches);
  }, [coins, tabSwitches]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prevSwitches) => {
          const newSwitches = prevSwitches + 1;
          if (newSwitches > 5) {
            if (coins >= 10) {
              setCoins((prevCoins) => prevCoins - 10);
              alert(`⚠️ Tab switched! -10 coins deducted`);
            } else {
              alert("🚫 No coins left! Stay on this tab.");
              return prevSwitches;
            }
          } else {
            alert(`⚠️ Tab switched! (${newSwitches}/5 free)`);
          }
          return newSwitches;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [coins]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeRemaining = (deadline) => {
    const total = Date.parse(deadline) - currentTime.getTime();
    if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    return { total, days, hours, minutes, seconds };
  };

  const handleAddAssignment = () => {
    if (!newAssignment.title || !newAssignment.deadline) return;
    setAssignments(prev => [...prev, { ...newAssignment, id: Date.now(), status: "Pending" }]);
    setNewAssignment({ title: "", deadline: "" });
  };

  const handleAddHackathon = () => {
    if (!newHackathon.title || !newHackathon.date) return;
    setHackathons(prev => [...prev, { ...newHackathon, id: Date.now(), status: "Pending" }]);
    setNewHackathon({ title: "", date: "", platform: "", link: "" });
  };

  const handleAddReminder = () => {
    if (!newReminder.title || !newReminder.time) return;
    setReminders(prev => [...prev, { ...newReminder, id: Date.now() }]);
    setNewReminder({ title: "", time: "" });
  };

  const toggleStatus = (id, type) => {
    const updater = (item) => item.id === id ? { ...item, status: item.status === "Pending" ? "Completed" : "Pending" } : item;
    if (type === "assignment") {
      setAssignments(prev => prev.map(updater));
    } else if (type === "hackathon") {
      setHackathons(prev => prev.map(updater));
    }
  };

  const removeReminder = (id) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const graphData = [
    {
      name: "Assignments",
      Completed: assignments.filter((a) => a.status === "Completed").length,
      Pending: assignments.filter((a) => a.status === "Pending").length,
    },
    {
      name: "Hackathons",
      Completed: hackathons.filter((h) => h.status === "Completed").length,
      Pending: hackathons.filter((h) => h.status === "Pending").length,
    },
  ];

  const filteredAssignments = assignments.filter(a => filter === "All" || a.status === filter);
  const filteredHackathons = hackathons.filter(h => filter === "All" || h.status === filter);

  return (
    <div className={darkMode ? 'dark-mode' : ''}>
      <div className="header">
        <h1>📚 Assignment & Hackathon Tracker</h1>
        <button id="darkModeToggle" className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <div className="status-section">
        <span className="coins">🪙 {coins} Coins</span>
        <span className="switches">🔄 {tabSwitches}/5 Free</span>
      </div>

      <div className="filter-section">
        <button className={filter === 'All' ? 'active-filter' : 'inactive-filter'} onClick={() => setFilter('All')}>All</button>
        <button className={filter === 'Pending' ? 'active-filter' : 'inactive-filter'} onClick={() => setFilter('Pending')}>Pending</button>
        <button className={filter === 'Completed' ? 'active-filter' : 'inactive-filter'} onClick={() => setFilter('Completed')}>Completed</button>
      </div>

      <div className="add-card">
        <h2>📝 Add Assignment</h2>
        <input type="text" placeholder="Assignment Title" value={newAssignment.title} onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}/>
        <input type="datetime-local" value={newAssignment.deadline} onChange={(e) => setNewAssignment({...newAssignment, deadline: e.target.value})}/>
        <button onClick={handleAddAssignment}>Add Assignment</button>
      </div>

      <div className="add-card">
        <h2>🏆 Add Hackathon</h2>
        <input type="text" placeholder="Hackathon Title" value={newHackathon.title} onChange={(e) => setNewHackathon({...newHackathon, title: e.target.value})} />
        <input type="date" value={newHackathon.date} onChange={(e) => setNewHackathon({...newHackathon, date: e.target.value})} />
        <input type="text" placeholder="Platform" value={newHackathon.platform} onChange={(e) => setNewHackathon({...newHackathon, platform: e.target.value})} />
        <input type="text" placeholder="Link" value={newHackathon.link} onChange={(e) => setNewHackathon({...newHackathon, link: e.target.value})} />
        <button onClick={handleAddHackathon}>Add Hackathon</button>
      </div>

      <div className="add-card">
        <h2>⏰ Add Reminder</h2>
        <input type="text" placeholder="Reminder Title" value={newReminder.title} onChange={(e) => setNewReminder({...newReminder, title: e.target.value})} />
        <input type="time" value={newReminder.time} onChange={(e) => setNewReminder({...newReminder, time: e.target.value})} />
        <button onClick={handleAddReminder}>Add Reminder</button>
      </div>

      <div className="add-card">
        <h2>📊 Weekly Stats</h2>
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Completed" stackId="a" fill="#4ade80" name="Completed" />
                <Bar dataKey="Pending" stackId="a" fill="#facc15" name="Pending" />
            </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>📝 Assignments</h2>
        <div className="item-grid">
            {filteredAssignments.map(a => {
                const remaining = getTimeRemaining(a.deadline);
                let cloudClass = 'pending-normal';
                if (a.status === 'Completed') {
                    cloudClass = 'completed';
                } else if (remaining.total <= 0) {
                    cloudClass = 'pending-urgent';
                } else if (remaining.total < 12 * 60 * 60 * 1000) {
                    cloudClass = 'pending-warning';
                }
                return (
                    <div key={a.id} className={`cloud-item assignment-item ${cloudClass}`}>
                        <p className="item-title">{a.title}</p>
                        <p className="item-details">
                            {remaining.total > 0 ? `${remaining.days}d ${remaining.hours}h ${remaining.minutes}m left` : "Expired"}
                        </p>
                        <button className="status-btn" onClick={() => toggleStatus(a.id, 'assignment')}>
                            {a.status === "Pending" ? "Mark Complete" : "Mark Pending"}
                        </button>
                    </div>
                );
            })}
        </div>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>🏆 Hackathons</h2>
        <div className="item-grid">
            {filteredHackathons.map(h => {
                const cloudClass = h.status === "Completed" ? 'completed' : 'pending-normal';
                return (
                    <div key={h.id} className={`cloud-item hackathon-item ${cloudClass}`}>
                         <p className="item-title">{h.title}</p>
                         <p className="item-details">{new Date(h.date).toLocaleDateString()}</p>
                         <p className="item-details">{h.platform}</p>

                         {/* ✅ CLICKABLE LINK ADDED HERE */}
                         {h.link && (
                           <a
                             href={h.link.startsWith("http") ? h.link : `https://${h.link}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="hackathon-link"
                           >
                             🔗 Visit Hackathon Page
                           </a>
                         )}

                         <button className="status-btn" onClick={() => toggleStatus(h.id, 'hackathon')}>
                             {h.status === "Pending" ? "Mark Complete" : "Mark Pending"}
                         </button>
                    </div>
                );
            })}
        </div>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>⏰ Reminders</h2>
        <div className="item-grid">
            {reminders.map(r => {
                const now = new Date();
                const [hours, minutes] = r.time.split(":").map(Number);
                const target = new Date(now);
                target.setHours(hours, minutes, 0, 0);
                const diff = target - now;
                const timeLeft = diff > 0 ? `${Math.floor(diff / 1000 / 60 / 60)}h ${Math.floor((diff / 1000 / 60) % 60)}m left` : "Time Passed";

                return(
                    <div key={r.id} className="cloud-item reminder-item">
                        <p className="item-title">{r.title}</p>
                        <p className="item-details">{r.time}</p>
                        <p className="item-details">{timeLeft}</p>
                        <button className="status-btn" onClick={() => removeReminder(r.id)}>Dismiss</button>
                    </div>
                );
            })}
        </div>
      </div>

      <style>{`
        /* All original CSS + new hackathon-link style */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        :root {
            --bg-start-color: #e6e0f0; --bg-end-color: #f0f3f8; --text-color: #333; --card-bg: #fff;
            --btn-gradient: linear-gradient(to right, #4338ca, #db2777); --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            --heading-color: #6B57E0; --yellow-200: #fef08a; --green-200: #dcfce7; --red-200: #fecaca; --orange-200: #fed7aa;
            --cloud-bg-assignment: #f7e6f8; --cloud-bg-hackathon: #e6f8f7; --cloud-bg-reminder: #f8e6f7;
            --cloud-bg-completed: #dceefc; --cloud-bg-urgent: #fbc2c2; --cloud-bg-warning: #ffe6cc;
        }
        body { padding: 2rem; margin: 0; }
        .app-container { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, var(--bg-start-color), var(--bg-end-color)); color: var(--text-color); min-height: 100vh; }
        .dark-mode { background: #1f2937; color: #e5e7eb; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .header h1 { font-size: 1.875rem; font-weight: 700; color: var(--heading-color); }
        .dark-mode .header h1 { color: #db2777; }
        .header .dark-mode-toggle { padding: 0.5rem 1rem; background: var(--btn-gradient); color: white; border: none; border-radius: 0.5rem; box-shadow: var(--box-shadow); cursor: pointer; transition: all 0.2s ease; }
        .status-section { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; }
        .status-section span { padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .status-section .coins { background-color: var(--yellow-200); }
        .status-section .switches { background-color: var(--green-200); }
        .filter-section { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
        .filter-section button { padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; font-weight: 600; box-shadow: var(--box-shadow); cursor: pointer; }
        .filter-section .active-filter { background: var(--btn-gradient); color: white; }
        .filter-section .inactive-filter { background-color: rgba(255, 255, 255, 0.3); color: #1f2937; }
        .dark-mode .filter-section .inactive-filter { background: #374151; color: #e5e7eb; }
        .add-card { margin-bottom: 2rem; padding: 1.5rem; background-color: rgba(255, 255, 255, 0.3); backdrop-filter: blur(8px); border-radius: 1rem; box-shadow: var(--box-shadow); }
        .dark-mode .add-card { background-color: rgba(31, 41, 55, 0.5); border: 1px solid rgba(255,255,255,0.1); }
        .add-card h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; }
        .add-card input { box-sizing: border-box; width: 100%; margin-bottom: 0.5rem; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #ccc; }
        .dark-mode .add-card input { background-color: #374151; color: #fff; border-color: #4b5563; }
        .add-card button { padding: 0.75rem 1rem; background: var(--btn-gradient); color: white; border: none; border-radius: 0.5rem; box-shadow: var(--box-shadow); cursor: pointer; }
        .item-grid { display: flex; flex-wrap: wrap; gap: 2rem; justify-content: flex-start; }
        .cloud-item { width: 250px; height: 150px; position: relative; padding: 1.5rem; border-radius: 50%; box-shadow: var(--box-shadow); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; cursor: pointer; transition: all 0.3s ease; animation: float-animation 6s ease-in-out infinite; }
        .cloud-item:hover { transform: translateY(-10px) scale(1.05); }
        .cloud-item::before, .cloud-item::after { content: ''; position: absolute; background: inherit; border-radius: 50%; z-index: -1; box-shadow: inherit; }
        .cloud-item::before { width: 100px; height: 100px; top: -50px; left: 25px; }
        .cloud-item::after { width: 120px; height: 120px; top: -30px; right: 10px; }
        .cloud-item:nth-child(even) { animation-delay: -3s; }
        @keyframes float-animation { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .cloud-item.assignment-item { background-color: var(--cloud-bg-assignment); }
        .cloud-item.hackathon-item { background-color: var(--cloud-bg-hackathon); }
        .cloud-item.reminder-item { background-color: var(--cloud-bg-reminder); }
        .cloud-item.completed { background-color: var(--cloud-bg-completed); }
        .cloud-item.pending-urgent { background-color: var(--cloud-bg-urgent); }
        .cloud-item.pending-warning { background-color: var(--cloud-bg-warning); }
        .item-title { font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem; }
        .item-details { font-size: 0.75rem; color: #4b5563; }
        .dark-mode .item-details { color: #d1d5db; }
        .status-btn { margin-top: 0.5rem; padding: 0.25rem 0.75rem; background: var(--btn-gradient); color: white; border: none; border-radius: 0.25rem; cursor: pointer; }
        .hackathon-link { margin-top: 0.25rem; font-size: 0.8rem; color: #2563eb; text-decoration: none; font-weight: 600; transition: color 0.2s ease; }
        .hackathon-link:hover { color: #1d4ed8; text-decoration: underline; }
      `}</style>
    </div>
  );
};

export default AssignmentCard;
