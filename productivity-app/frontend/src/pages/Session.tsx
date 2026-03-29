import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Square, RefreshCw } from "lucide-react";
import { useSessionStore } from "../store/sessionStore";
import { useActivityMonitor } from "../hooks/useActivityMonitor";
import { useCheckins } from "../hooks/useCheckins";
import { useLiveSignals } from "../hooks/useLiveSignals";
import { useElectronMonitor } from "../hooks/useElectronMonitor";
import { endSession } from "../api/client";
import { CheckinModal } from "../components/CheckinModal";
import { ScoreRing } from "../components/ScoreRing";
import { StatCard } from "../components/StatCard";
import { AlertFeed, type Alert } from "../components/AlertFeed";
import { ActivityChart, type DataPoint } from "../components/ActivityChart";
import { SessionTimer } from "../components/SessionTimer";
import { StatusIndicator } from "../components/StatusIndicator";
import { WebcamPanel } from "../components/WebcamPanel";

function signalToScore(value: string | null, goodValues: string[]): number {
  if (!value) return 100;
  return goodValues.includes(value) ? 100 : Math.floor(Math.random() * 30 + 30);
}

function formatMinutesAgo(ts: number | null): string {
  if (ts === null) return "—";
  const mins = Math.floor((Date.now() - ts) / 60_000);
  return mins < 1 ? "Just now" : `${mins} min ago`;
}

export function Session() {
  const { sessionId, goalText, durationMinutes, signals, clearSession } = useSessionStore();
  const navigate = useNavigate();

  const [postureScore, setPostureScore] = useState(100);
  const [attentionScore, setAttentionScore] = useState(100);
  const [distractions, setDistractions] = useState(0);
  const [postureAlerts, setPostureAlerts] = useState(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [tab, setTab] = useState<"monitor" | "history">("monitor");
  const [lastWaterBreak, setLastWaterBreak] = useState<number | null>(null);
  const [waterBreakLabel, setWaterBreakLabel] = useState("—");

  useActivityMonitor();
  useLiveSignals();
  useElectronMonitor();
  const { showModal, submitCheckin } = useCheckins();

  useEffect(() => {
    if (!sessionId) { navigate("/"); return; }
  }, [sessionId, navigate]);

  // Derive scores from live signals and accumulate chart/alert data
  useEffect(() => {
    if (!sessionId) return;

    const newPosture = signalToScore(signals.posture, ["good"]);
    const newAttention = signalToScore(signals.eyes, ["open"]);
    setPostureScore(newPosture);
    setAttentionScore(newAttention);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

    setChartData((prev) => [...prev.slice(-30), { time: timeStr, posture: newPosture, attention: newAttention }]);

    if (signals.posture === "bad") {
      setPostureAlerts((p) => p + 1);
      setAlerts((a) => [
        { id: crypto.randomUUID(), message: "Poor posture detected — sit up straight!", type: "warning", time: timeStr },
        ...a.slice(0, 19),
      ]);
    }
    if (signals.eyes === "away" || signals.eyes === "closed") {
      setDistractions((d) => d + 1);
      setAlerts((a) => [
        { id: crypto.randomUUID(), message: "Eyes off screen — stay focused!", type: "danger", time: timeStr },
        ...a.slice(0, 19),
      ]);
    }
    if (signals.activity === "idle") {
      setAlerts((a) => [
        { id: crypto.randomUUID(), message: "Idle detected — are you still there?", type: "info", time: timeStr },
        ...a.slice(0, 19),
      ]);
    }
  }, [signals, sessionId]);

  // Auto-detect water consumption via camera (cup/bottle/glass detected)
  useEffect(() => {
    if (!signals.drinking || signals.drinking === "none") return;
    setLastWaterBreak(Date.now());
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setAlerts((a) => [
      { id: crypto.randomUUID(), message: `Water break detected — ${signals.drinking} spotted! 💧`, type: "info", time: timeStr },
      ...a.slice(0, 19),
    ]);
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

  const handleDismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
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
      {showModal && <CheckinModal onSubmit={submitCheckin} />}

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
          {/* Col 1: Webcam + Timer + Status */}
          <div className="flex flex-col gap-4">
            <WebcamPanel isActive={!!sessionId} />
            <SessionTimer isRunning={!!sessionId} totalSeconds={durationMinutes * 60} />
            <StatusIndicator isActive={!!sessionId} label={eyeStatus} ok={eyeOk} />
          </div>

          {/* Col 2: Score Rings + Stats */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <span className="text-xs font-semibold tracking-widest uppercase text-muted-fg">Live Scores</span>
              <div className="flex items-center justify-center gap-8 mt-4">
                <ScoreRing score={postureScore} maxScore={100} label="Posture" />
                <ScoreRing score={attentionScore} maxScore={100} label="Attention" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatCard title="Focus Streak" value={`${chartData.length}`} subtitle="Continuous focus" icon="🎯" />
              <StatCard title="Water Break" value={waterBreakLabel} subtitle="Hydration timer" icon="💧" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatCard title="Distractions" value={distractions} subtitle="Eyes off screen" icon="👀" />
              <StatCard title="Posture Alerts" value={postureAlerts} subtitle="This session" icon="🏋" />
            </div>
          </div>

          {/* Col 3: Chart + Alerts */}
          <div className="flex flex-col gap-4">
            <ActivityChart data={chartData} />
            <AlertFeed alerts={alerts} onDismiss={handleDismissAlert} />
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
