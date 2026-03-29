import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Play } from "lucide-react";
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
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-1">
          <Activity className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-fg">FocusGuard</h1>
        </div>
        <p className="text-muted-fg text-sm mb-8">Set your goal and start tracking.</p>

        <label className="block text-xs font-semibold tracking-widest uppercase text-muted-fg mb-2">
          What's your goal?
        </label>
        <input
          className="w-full bg-secondary text-fg rounded-xl px-4 py-3 mb-6 outline-none border border-border focus:ring-2 focus:ring-primary transition-shadow"
          placeholder="e.g. Finish the landing page"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />

        <label className="block text-xs font-semibold tracking-widest uppercase text-muted-fg mb-2">
          Duration (minutes)
        </label>
        <input
          type="number"
          min={5}
          max={120}
          className="w-full bg-secondary text-fg rounded-xl px-4 py-3 mb-8 outline-none border border-border focus:ring-2 focus:ring-primary transition-shadow"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />

        <button
          onClick={handleStart}
          disabled={loading || !goal.trim()}
          className="w-full py-4 rounded-xl bg-primary text-primary-fg font-bold text-lg hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" />
          {loading ? "Starting..." : "Start Session"}
        </button>
      </div>
    </div>
  );
}
