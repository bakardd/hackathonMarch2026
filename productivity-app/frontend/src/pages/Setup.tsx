import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { startSession } from "../api/client";
import { useSessionStore } from "../store/sessionStore";

export function Setup() {
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState(25);
  const [loading, setLoading] = useState(false);
  const { setSession } = useSessionStore();
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    const { session_id } = await startSession(goal, duration);
    setSession(session_id, goal, duration);
    navigate("/session");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-2">Focus Session</h1>
        <p className="text-gray-500 mb-8">Set your goal and start tracking.</p>

        <label className="block text-sm text-gray-400 mb-1">What's your goal?</label>
        <input
          className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 mb-6 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g. Finish the landing page"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />

        <label className="block text-sm text-gray-400 mb-1">Duration (minutes)</label>
        <input
          type="number"
          min={5}
          max={120}
          className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 mb-8 outline-none focus:ring-2 focus:ring-indigo-500"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />

        <button
          onClick={handleStart}
          disabled={loading || !goal.trim()}
          className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-500 disabled:opacity-40 transition-colors"
        >
          {loading ? "Starting..." : "Start Session"}
        </button>
      </div>
    </div>
  );
}
