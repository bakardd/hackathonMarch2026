import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Activity, ArrowRight } from "lucide-react";
import { getSessionSummary } from "../api/client";
import { ScoreRing } from "../components/ScoreRing";
import { StatCard } from "../components/StatCard";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface SummaryData {
  focus_score: number;
  total_events: number;
  breakdown: Record<string, Record<string, number>>;
  events: { type: string; value: string; timestamp: string }[];
}

export function Summary() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<SummaryData | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    getSessionSummary(Number(sessionId)).then(setData);
  }, [sessionId]);

  if (!data) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-fg">
        <div className="w-3 h-3 rounded-full bg-primary animate-pulse-ring" />
        Loading summary...
      </div>
    </div>
  );

  const timeline = data.events.map((e, i) => ({
    i,
    label: e.type,
    good: ["good", "open", "focused"].includes(e.value) ? 100 : 30,
  }));

  const goodPosture = data.breakdown?.posture?.good ?? 0;
  const badPosture = data.breakdown?.posture?.bad ?? 0;
  const totalPosture = goodPosture + badPosture;
  const posturePercent = totalPosture > 0 ? Math.round((goodPosture / totalPosture) * 100) : 0;

  const eyesOpen = data.breakdown?.eyes?.open ?? 0;
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Events" value={data.total_events} subtitle="Recorded signals" icon="📊" />
        <StatCard title="Good Posture" value={`${posturePercent}%`} subtitle={`${goodPosture} of ${totalPosture}`} icon="🏋" />
        <StatCard title="Eyes On" value={`${attentionPercent}%`} subtitle={`${eyesOpen} of ${eyesTotal}`} icon="👀" />
      </div>

      {/* Timeline Chart */}
      <div className="rounded-xl border border-border bg-card p-6">
        <span className="text-xs font-semibold tracking-widest uppercase text-muted-fg">Event Timeline</span>
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 30% 18%)" />
              <XAxis dataKey="i" hide />
              <YAxis domain={[0, 100]} hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220 40% 10%)",
                  border: "1px solid hsl(220 30% 18%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="good" stroke="hsl(145 80% 42%)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown */}
      <div className="rounded-xl border border-border bg-card p-6">
        <span className="text-xs font-semibold tracking-widest uppercase text-muted-fg mb-3 block">Breakdown</span>
        {Object.entries(data.breakdown).map(([type, values]) => (
          <div key={type} className="mb-3">
            <p className="text-muted-fg text-sm capitalize mb-1">{type}</p>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(values).map(([val, count]) => (
                <span key={val} className="bg-secondary text-muted-fg text-xs px-3 py-1 rounded-full">
                  {val}: {count}
                </span>
              ))}
            </div>
          </div>
        ))}
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
