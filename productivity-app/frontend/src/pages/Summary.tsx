import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSessionSummary } from "../api/client";
import { FocusScore } from "../components/FocusScore";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      Loading summary...
    </div>
  );

  // Build timeline data for chart
  const timeline = data.events.map((e, i) => ({
    i,
    label: e.type,
    good: ["good", "open", "focused"].includes(e.value) ? 1 : 0,
  }));

  return (
    <div className="min-h-screen bg-gray-950 p-6 flex flex-col gap-6">
      <h1 className="text-3xl font-black text-white">Session Summary</h1>

      <FocusScore score={Math.round(data.focus_score)} />

      <div className="bg-gray-900 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Event Timeline</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="i" hide />
            <YAxis domain={[0, 1]} hide />
            <Tooltip
              contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8 }}
              labelStyle={{ color: "#9ca3af" }}
            />
            <Line type="monotone" dataKey="good" stroke="#6366f1" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-3">Breakdown</h3>
        {Object.entries(data.breakdown).map(([type, values]) => (
          <div key={type} className="mb-3">
            <p className="text-gray-400 text-sm capitalize mb-1">{type}</p>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(values).map(([val, count]) => (
                <span key={val} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full">
                  {val}: {count}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/")}
        className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-500 transition-colors"
      >
        New Session
      </button>
    </div>
  );
}
