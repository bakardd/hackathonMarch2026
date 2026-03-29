import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../store/sessionStore";
import { useLiveSignals } from "../hooks/useLiveSignals";
import { useElectronMonitor } from "../hooks/useElectronMonitor";
import { endSession } from "../api/client";
import { WebcamPanel } from "../components/WebcamPanel";

export function Session() {
  const { sessionId, goalText, distractionApp, permissionError, clearSession } = useSessionStore();
  const navigate = useNavigate();

  useLiveSignals();
  useElectronMonitor();

  useEffect(() => {
    if (!sessionId) navigate("/");
  }, [sessionId, navigate]);

  const handleEnd = useCallback(async () => {
    if (!sessionId) return;
    await endSession(sessionId);
    clearSession();
    navigate("/");
  }, [sessionId, navigate, clearSession]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 gap-6">

      {/* Permission error (Electron only) */}
      {permissionError && (
        <div className="w-full max-w-md rounded-xl border border-status-warning/40 bg-status-warning/10 px-4 py-3 text-sm text-status-warning">
          <p className="font-semibold">App monitoring unavailable</p>
          <p className="mt-1 text-xs opacity-80">{permissionError}</p>
        </div>
      )}

      {/* Goal label */}
      <p className="text-muted-fg text-sm">
        Goal: <span className="text-fg font-semibold">{goalText}</span>
      </p>

      {/* Camera feed — the whole point */}
      <div className="w-full max-w-lg">
        <WebcamPanel isActive={!!sessionId} />
      </div>

      {/* Distraction banner */}
      {distractionApp && (
        <div className="w-full max-w-lg rounded-xl border border-status-danger/40 bg-status-danger/10 px-4 py-3 text-sm text-status-danger flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <span>
            You switched to <span className="font-semibold">{distractionApp}</span> — get back to work.
          </span>
        </div>
      )}

      {/* Stop button */}
      <button
        onClick={handleEnd}
        className="px-8 py-3 rounded-xl border border-status-danger text-status-danger font-semibold hover:bg-status-danger/10 transition-colors"
      >
        End Session
      </button>
    </div>
  );
}
