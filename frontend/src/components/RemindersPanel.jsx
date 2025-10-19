import React, { useState } from "react";

const RemindersPanel = () => {
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState("");
  const [dateTime, setDateTime] = useState("");

  const addReminder = () => {
    if (newReminder.trim() && dateTime) {
      setReminders([
        ...reminders,
        { id: Date.now(), text: newReminder, time: dateTime },
      ]);
      setNewReminder("");
      setDateTime("");
    }
  };

  const deleteReminder = (id) => {
    setReminders(reminders.filter((reminder) => reminder.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-r from-green-100 via-blue-100 to-purple-100 p-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">⏰ My Reminders</h1>

      {/* Input Section */}
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-lg mb-6">
        <input
          type="text"
          placeholder="Enter your reminder..."
          value={newReminder}
          onChange={(e) => setNewReminder(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-full mb-3 focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-full mb-3 focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <button
          onClick={addReminder}
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
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex justify-between items-center bg-white shadow-md rounded-xl p-4 hover:shadow-xl transition"
            >
              <div>
                <p className="text-lg font-medium text-gray-800">
                  {reminder.text}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(reminder.time).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => deleteReminder(reminder.id)}
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition"
              >
                ❌ Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RemindersPanel;
