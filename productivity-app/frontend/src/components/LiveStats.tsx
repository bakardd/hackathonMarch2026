import { useEffect, useState } from "react";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface TimeStats {
  eyes: {
    on_screen_s: number;
    away_total_s: number;
    closed_s: number;
    away_s: number;
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
    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function StatRow({ label, value, pct, color, bar }: {
  label: string;
  value: string;
  pct: number;
  color: string;
  bar?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-muted-fg">{label}</span>
        <span className={`text-xs font-mono font-bold ${color}`}>
          {value} <span className="text-muted-fg font-normal">({pct}%)</span>
        </span>
      </div>
      {bar !== false && <Bar pct={pct} color={color.replace("text-", "bg-")} />}
    </div>
  );
}

interface LiveStatsProps {
  sessionId: number;
}

export function LiveStats({ sessionId }: LiveStatsProps) {
  const [live, setLive] = useState<TimeStats | null>(null);
  const [final, setFinal] = useState<TimeStats | null>(null);

  // Poll live stats every 5s
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`${BASE}/analytics/${sessionId}/time-stats`);
        const data: TimeStats = await res.json();
        if (!cancelled) setLive(data);
      } catch { /* ignore */ }
    }
    poll();
    const id = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [sessionId]);

  // Poll for camera final stats every 3s (appears when camera service exits)
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`${BASE}/analytics/${sessionId}/camera-stats`);
        if (res.ok) {
          const data = await res.json();
          if (data && !cancelled) setFinal(data);
        }
      } catch { /* ignore */ }
    }
    poll();
    const id = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, [sessionId]);

  const stats = final ?? live;
  if (!stats) return null;

  const { eyes, posture } = stats;

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest uppercase text-muted-fg">Time Summary</span>
        {final && (
          <span className="text-[10px] font-bold tracking-wider uppercase text-primary">Final</span>
        )}
        {!final && (
          <span className="flex items-center gap-1 text-[10px] text-muted-fg/60">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            live
          </span>
        )}
      </div>

      {/* Eyes */}
      <div className="flex flex-col gap-2">
        <StatRow label="Eyes on screen" value={fmt(eyes.on_screen_s)} pct={eyes.on_pct} color="text-green-400" />
        <StatRow label="Eyes away" value={fmt(eyes.away_total_s)} pct={eyes.away_pct} color="text-red-400" />
        {(eyes.closed_s > 0 || eyes.away_s > 0) && (
          <div className="flex gap-4 pl-1">
            <span className="text-[10px] text-muted-fg/60">closed {fmt(eyes.closed_s)}</span>
            <span className="text-[10px] text-muted-fg/60">looking away {fmt(eyes.away_s)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-border" />

      {/* Posture */}
      <div className="flex flex-col gap-2">
        <StatRow label="Good posture" value={fmt(posture.good_s)} pct={posture.good_pct} color="text-green-400" />
        <StatRow label="Bad posture" value={fmt(posture.bad_s)} pct={posture.bad_pct} color="text-red-400" />
      </div>
    </div>
  );
}
