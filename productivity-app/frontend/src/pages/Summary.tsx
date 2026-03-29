import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Activity, ArrowRight } from "lucide-react";
import { getSessionSummary } from "../api/client";
import { ScoreRing } from "../components/ScoreRing";
import { StatCard } from "../components/StatCard";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface SummaryData {
  focus_score: number;
  total_events: number;
  breakdown: Record<string, Record<string, number>>;
}

interface CameraStats {
  total_s: number;
  eyes: {
    on_screen_s: number;
    closed_s: number;
    away_s: number;
    away_total_s: number;
    on_pct: number;
    away_pct: number;
  };
  posture: {
    good_s: number;
    bad_s: number;
    good_pct: number;
    bad_pct: number;
  };
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec.toString().padStart(2, "0")}s` : `${sec}s`;
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export function Summary() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<SummaryData | null>(null);
  const [camera, setCamera] = useState<CameraStats | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const id = Number(sessionId);
    getSessionSummary(id).then(setData);
    fetch(`${BASE}/analytics/${id}/camera-stats`)
      .then((r) => r.json())
      .then((d) => { if (d) setCamera(d); })
      .catch(() => {});
  }, [sessionId]);

  if (!data) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-fg">
        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
        Loading summary...
      </div>
    </div>
  );

  const goodPosture = data.breakdown?.posture?.good ?? 0;
  const badPosture  = data.breakdown?.posture?.bad ?? 0;
  const totalPosture = goodPosture + badPosture;
  const posturePercent = totalPosture > 0 ? Math.round((goodPosture / totalPosture) * 100) : 0;

  const eyesOpen  = data.breakdown?.eyes?.open ?? 0;
  const eyesTotal = Object.values(data.breakdown?.eyes ?? {}).reduce((a, b) => a + b, 0);
  const attentionPercent = eyesTotal > 0 ? Math.round((eyesOpen / eyesTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-bg p-6 max-w-[900px] mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold text-fg">Session Summary</h1>
      </div>

      {/* Score Rings */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-center gap-10">
          <ScoreRing score={Math.round(data.focus_score)} maxScore={100} label="Focus Score" size={160} />
          <ScoreRing score={posturePercent} maxScore={100} label="Posture" />
          <ScoreRing score={attentionPercent} maxScore={100} label="Attention" />
        </div>
      </div>

      {/* Camera time stats */}
      {camera ? (
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-fg">Camera Session</span>
            <span className="text-xs text-muted-fg font-mono">Total {fmt(camera.total_s)}</span>
          </div>

          {/* Eyes */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-muted-fg uppercase tracking-wide">Eyes</span>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-fg">On screen</span>
                <span className="font-mono font-bold text-green-400">{fmt(camera.eyes.on_screen_s)} <span className="text-muted-fg font-normal text-xs">({camera.eyes.on_pct}%)</span></span>
              </div>
              <Bar pct={camera.eyes.on_pct} color="bg-green-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-fg">Away</span>
                <span className="font-mono font-bold text-red-400">{fmt(camera.eyes.away_total_s)} <span className="text-muted-fg font-normal text-xs">({camera.eyes.away_pct}%)</span></span>
              </div>
              <Bar pct={camera.eyes.away_pct} color="bg-red-400" />
              <div className="flex gap-6 pl-1 mt-0.5">
                <span className="text-[11px] text-muted-fg/70">closed: {fmt(camera.eyes.closed_s)}</span>
                <span className="text-[11px] text-muted-fg/70">looking away: {fmt(camera.eyes.away_s)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Posture */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-muted-fg uppercase tracking-wide">Posture</span>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-fg">Good</span>
                <span className="font-mono font-bold text-green-400">{fmt(camera.posture.good_s)} <span className="text-muted-fg font-normal text-xs">({camera.posture.good_pct}%)</span></span>
              </div>
              <Bar pct={camera.posture.good_pct} color="bg-green-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-fg">Bad</span>
                <span className="font-mono font-bold text-red-400">{fmt(camera.posture.bad_s)} <span className="text-muted-fg font-normal text-xs">({camera.posture.bad_pct}%)</span></span>
              </div>
              <Bar pct={camera.posture.bad_pct} color="bg-red-400" />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-center text-sm text-muted-fg">
          No camera data — run <code className="mx-1 px-1.5 py-0.5 bg-secondary rounded text-xs">make camera SESSION={sessionId}</code> during your session
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Events" value={data.total_events} subtitle="Recorded signals" icon="📊" />
        <StatCard title="Good Posture" value={`${posturePercent}%`} subtitle={`${goodPosture} of ${totalPosture}`} icon="🪑" />
        <StatCard title="Eyes On" value={`${attentionPercent}%`} subtitle={`${eyesOpen} of ${eyesTotal}`} icon="👁️" />
      </div>

      <button
        onClick={() => navigate("/")}
        className="w-full py-4 rounded-xl bg-primary text-primary-fg font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        New Session
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
