import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../store/sessionStore";
import { useActivityMonitor } from "../hooks/useActivityMonitor";
import { useCheckins } from "../hooks/useCheckins";
import { useLiveSignals } from "../hooks/useLiveSignals";
import { useElectronMonitor } from "../hooks/useElectronMonitor";
import { endSession } from "../api/client";
import { SignalBadge } from "../components/SignalBadge";
import { CheckinModal } from "../components/CheckinModal";

export function Session() {
  const { sessionId, goalText, durationMinutes, signals, clearSession } = useSessionStore();
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(0);

  useActivityMonitor();
  useLiveSignals();
  useElectronMonitor(); // no-op in browser, active in Electron
  const { showModal, submitCheckin } = useCheckins();

  useEffect(() => {
    if (!sessionId) { navigate("/"); return; }
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleEnd = async () => {
    if (!sessionId) return;
    await endSession(sessionId);
    navigate(`/summary/${sessionId}`);
    clearSession();
  };

  const remaining = durationMinutes * 60 - elapsed;
  const mins = Math.max(0, Math.floor(remaining / 60));
  const secs = Math.max(0, remaining % 60);

  return (
    <div className="min-h-screen bg-gray-950 p-6 flex flex-col gap-6">
      {showModal && <CheckinModal onSubmit={submitCheckin} />}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">Current goal</p>
          <h2 className="text-white text-xl font-bold">{goalText}</h2>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-sm">Time remaining</p>
          <p className="text-white text-2xl font-mono font-bold">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SignalBadge label="Posture" value={signals.posture} goodValues={["good"]} />
        <SignalBadge label="Eyes" value={signals.eyes} goodValues={["open"]} />
        <SignalBadge label="Activity" value={signals.activity} goodValues={["focused"]} />
      </div>

      <div className="mt-auto">
        <button
          onClick={handleEnd}
          className="w-full py-4 rounded-xl bg-red-700 text-white font-bold text-lg hover:bg-red-600 transition-colors"
        >
          End Session
        </button>
      </div>
    </div>
  );
}
