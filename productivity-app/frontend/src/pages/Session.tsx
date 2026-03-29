import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Square, RefreshCw } from "lucide-react";
import { useSessionStore } from "../store/sessionStore";
import { useActivityMonitor } from "../hooks/useActivityMonitor";
import { useLiveSignals } from "../hooks/useLiveSignals";
import { useElectronMonitor } from "../hooks/useElectronMonitor";
import { endSession } from "../api/client";
import { StatCard } from "../components/StatCard";
import { LiveStats } from "../components/LiveStats";
import { SessionTimer } from "../components/SessionTimer";
import { StatusIndicator } from "../components/StatusIndicator";

function formatMinutesAgo(ts: number | null): string {
  if (ts === null) return "—";
  const mins = Math.floor((Date.now() - ts) / 60_000);
  return mins < 1 ? "Just now" : `${mins} min ago`;
}

export function Session() {
  const {
    sessionId,
    durationMinutes,
    signals,
    allowedApps,
    distractionWarning,
    monitorStatus,
    hideDistractionWarning,
    clearSession,
  } = useSessionStore();
  const navigate = useNavigate();

  const [distractions, setDistractions] = useState(0);
  const [postureAlerts, setPostureAlerts] = useState(0);
  const [tab, setTab] = useState<"monitor" | "history">("monitor");
  const [lastWaterBreak, setLastWaterBreak] = useState<number | null>(null);
  const [waterBreakLabel, setWaterBreakLabel] = useState("—");

  useActivityMonitor();
  useLiveSignals();
  useElectronMonitor();

  useEffect(() => {
    if (!sessionId) { navigate("/"); return; }
  }, [sessionId, navigate]);

  // Derive scores from live signals and accumulate chart/alert data
  useEffect(() => {
    if (!sessionId) return;

    if (signals.posture === "bad") setPostureAlerts((p) => p + 1);
    if (signals.eyes === "away" || signals.eyes === "closed") setDistractions((d) => d + 1);
  }, [signals, sessionId]);

  // Auto-detect water consumption via camera (cup/bottle/glass detected)
  useEffect(() => {
    if (!signals.drinking || signals.drinking === "none") return;
    setLastWaterBreak(Date.now());
  }, [signals.drinking]);

  // Update water break label every 10 seconds
  useEffect(() => {
    setWaterBreakLabel(formatMinutesAgo(lastWaterBreak));
    const interval = setInterval(() => setWaterBreakLabel(formatMinutesAgo(lastWaterBreak)), 10_000);
    return () => clearInterval(interval);
  }, [lastWaterBreak]);

  const handleWaterBreak = useCallback(() => {
    setLastWaterBreak(Date.now());
  }, []);

const handleEnd = useCallback(async () => {
    if (!sessionId) return;
    await endSession(sessionId);
    navigate(`/summary/${sessionId}`);
    clearSession();
  }, [sessionId, navigate, clearSession]);

  // Derive eye status for StatusIndicator
  const eyeStatus = signals.eyes === "open" || !signals.eyes ? "Eyes on screen ✓" : "Eyes off screen ✗";
  const eyeOk = signals.eyes === "open" || !signals.eyes;

  return (
    <div className="min-h-screen bg-bg p-6 max-w-[1400px] mx-auto">
      {monitorStatus.permissionError && (
        <div className="mb-4 rounded-2xl border border-status-warning/40 bg-status-warning/10 px-4 py-3 text-sm text-status-warning">
          <p className="font-semibold uppercase tracking-widest">App monitoring unavailable</p>
          <p className="mt-1">{monitorStatus.permissionError}</p>
          <p className="mt-1 text-xs opacity-80">
            Check macOS `System Settings {" > "} Privacy & Security {" > "} Accessibility`, then fully restart Electron.
          </p>
        </div>
      )}
      {distractionWarning.visible && (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto w-full max-w-md rounded-2xl border border-status-danger/40 bg-card p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-status-danger">Distraction detected</p>
              <p className="mt-2 text-fg">
                You switched to <span className="font-semibold">{distractionWarning.currentApp}</span>, which is outside your selected work apps.
              </p>
              <p className="mt-1 text-xs text-muted-fg">
                Allowed: {allowedApps.join(", ")}
              </p>
            </div>
            <button
              type="button"
              onClick={hideDistractionWarning}
              className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-muted-fg hover:text-fg"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Activity className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-fg">FocusGuard</h1>
            <span className="text-[10px] font-bold tracking-wider uppercase bg-primary text-primary-fg px-2 py-0.5 rounded">
              Monitor
            </span>
          </div>
          <p className="text-xs text-muted-fg font-mono">Production Monitoring System v0.1</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleWaterBreak}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary text-primary font-semibold text-sm hover:bg-primary/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Water Break
          </button>
          <button
            onClick={handleEnd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive text-destructive font-semibold text-sm hover:bg-destructive/10 transition-colors"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-6">
        <button
          onClick={() => setTab("monitor")}
          className={`pb-2 text-sm font-semibold tracking-wider uppercase transition-colors ${
            tab === "monitor" ? "text-primary border-b-2 border-primary" : "text-muted-fg hover:text-fg"
          }`}
        >
          Monitor
        </button>
        <button
          onClick={() => setTab("history")}
          className={`pb-2 text-sm font-semibold tracking-wider uppercase transition-colors ${
            tab === "history" ? "text-primary border-b-2 border-primary" : "text-muted-fg hover:text-fg"
          }`}
        >
          History
        </button>
      </div>

      {tab === "monitor" ? (
        /* 3-Column Dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Col 1: Timer + Status */}
          <div className="flex flex-col gap-4">
            <SessionTimer isRunning={!!sessionId} totalSeconds={durationMinutes * 60} />
            <StatusIndicator isActive={!!sessionId} label={eyeStatus} ok={eyeOk} />
          </div>

          {/* Col 2: Stats */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <StatCard title="Focus Streak" value={`${postureAlerts + distractions}`} subtitle="Total alerts" icon="🎯" />
              <StatCard title="Water Break" value={waterBreakLabel} subtitle="Hydration timer" icon="💧" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatCard title="Distractions" value={distractions} subtitle="Eyes off screen" icon="👀" />
              <StatCard title="Posture Alerts" value={postureAlerts} subtitle="This session" icon="🏋" />
            </div>
            {sessionId && <LiveStats sessionId={sessionId} />}
          </div>

        </div>
      ) : (
        /* History tab placeholder */
        <div className="flex items-center justify-center min-h-[400px] rounded-xl border border-border bg-card">
          <span className="text-muted-fg text-sm">Session history coming soon</span>
        </div>
      )}
    </div>
  );
}
