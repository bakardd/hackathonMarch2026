import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Play } from "lucide-react";
import { startSession } from "../api/client";
import { APP_OPTIONS } from "../lib/appMonitor";
import { useSessionStore } from "../store/sessionStore";

export function Setup() {
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState(25);
  const [selectedApps, setSelectedApps] = useState<string[]>(["Visual Studio Code"]);
  const [customApp, setCustomApp] = useState("");
  const [loading, setLoading] = useState(false);
  const { setSession } = useSessionStore();
  const navigate = useNavigate();

  const toggleApp = (appName: string) =>
    setSelectedApps((prev) =>
      prev.includes(appName) ? prev.filter((item) => item !== appName) : [...prev, appName]
    );

  const addCustomApp = () => {
    const normalized = customApp.trim();
    if (!normalized || selectedApps.includes(normalized)) return;
    setSelectedApps((prev) => [...prev, normalized]);
    setCustomApp("");
  };

  const handleStart = async () => {
    if (!goal.trim() || selectedApps.length === 0) return;
    setLoading(true);
    const { session_id } = await startSession(goal, duration);
    setSession(session_id, goal, duration, selectedApps);
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

        <label className="mb-2 block text-xs font-semibold tracking-widest uppercase text-muted-fg">
          Which apps are allowed for this session?
        </label>
        <div className="mb-4 flex flex-wrap gap-2">
          {APP_OPTIONS.map((appName) => {
            const isSelected = selectedApps.includes(appName);
            return (
              <button
                key={appName}
                type="button"
                onClick={() => toggleApp(appName)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  isSelected
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-border bg-secondary text-muted-fg hover:text-fg"
                }`}
              >
                {appName}
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex gap-2">
          <input
            className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-fg outline-none transition-shadow focus:ring-2 focus:ring-primary"
            placeholder="Add another app, e.g. Slack"
            value={customApp}
            onChange={(e) => setCustomApp(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomApp();
              }
            }}
          />
          <button
            type="button"
            onClick={addCustomApp}
            className="rounded-xl border border-border px-4 text-sm font-semibold text-fg hover:bg-white/5"
          >
            Add
          </button>
        </div>

        <button
          onClick={handleStart}
          disabled={loading || !goal.trim() || selectedApps.length === 0}
          className="w-full py-4 rounded-xl bg-primary text-primary-fg font-bold text-lg hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" />
          {loading ? "Starting..." : "Start Session"}
        </button>
      </div>
    </div>
  );
}
