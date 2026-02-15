import { useAppContext } from "../context/AppContext";

const RemindersPanel = () => {
  const {
    reminders, addReminder, removeReminder,
    highlightedReminders, clearToast
  } = useAppContext();

  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [reminderTime, setReminderTime] = useState("");

  const handleAdd = async () => {
    if (newReminderTitle.trim() && reminderTime) {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("/api/reminders/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: newReminderTitle, time: reminderTime }),
        });
        const data = await res.json();
        if (data.success) {
          addReminder(data.reminder);
          setNewReminderTitle("");
          setReminderTime("");
        }
      } catch (err) {
        console.error("Error adding reminder:", err);
      }
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        removeReminder(id);
      }
    } catch (err) {
      console.error("Error deleting reminder:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-r from-green-100 via-blue-100 to-purple-100 p-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">⏰ My Reminders</h1>

      {/* Input Section */}
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-lg mb-6">
        <input
          type="text"
          placeholder="Enter your reminder..."
          value={newReminderTitle}
          onChange={(e) => setNewReminderTitle(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-full mb-3 focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <input
          type="time"
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-full mb-3 focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg w-full hover:bg-blue-700 transition"
        >
          ➕ Add Reminder
        </button>
      </div>

      {/* Reminders List */}
      <div className="w-full max-w-lg space-y-4">
        {reminders.length === 0 ? (
          <p className="text-gray-600 text-center">No reminders yet!</p>
        ) : (
          reminders.map((reminder) => {
            const isHighlighted = highlightedReminders.has(reminder._id);
            return (
              <div
                key={reminder._id}
                className="flex justify-between items-center bg-white shadow-md rounded-xl p-4 hover:shadow-xl transition"
              >
                <div>
                  <p className="text-lg font-medium text-gray-800">
                    {reminder.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {reminder.time}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(reminder._id)}
                  className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200 hover:text-red-600 transition"
                >
                  Dismiss
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RemindersPanel;
