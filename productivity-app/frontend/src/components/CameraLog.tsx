import { useEffect, useState } from "react";
import { createWebSocket } from "../api/client";
import { useSessionStore } from "../store/sessionStore";

interface LogEntry {
  id: string;
  line: string;
  color: string;
  ts: string;
}

const MAX_ENTRIES = 10;

function formatLine(type: string, value: string, confidence: number | null): string {
  const tag = `[${type.padEnd(7)}]`;
  if (type === "eyes") {
    const ear = confidence != null ? confidence.toFixed(3) : "—";
    return `${tag} ${value} (EAR=${ear})`;
  }
  if (type === "posture") {
    const conf = confidence != null ? confidence.toFixed(2) : "—";
    return `${tag} ${value} (conf=${conf})`;
  }
  return `${tag} ${value}`;
}

function lineColor(type: string, value: string): string {
  if (type === "eyes") {
    if (value === "open") return "text-green-400";
    if (value === "closed") return "text-yellow-400";
    return "text-red-400";
  }
  if (type === "posture") return value === "good" ? "text-green-400" : "text-red-400";
  return "text-blue-400";
}

export function CameraLog() {
  const { sessionId } = useSessionStore();
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    const ws = createWebSocket(sessionId);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data) as { type: string; value: string; confidence?: number };
      const { type, value, confidence = null } = data;
      if (!["posture", "eyes"].includes(type)) return;

      const now = new Date();
      const ts = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

      setLog((prev) => [
        { id: crypto.randomUUID(), line: formatLine(type, value, confidence), color: lineColor(type, value), ts },
        ...prev.slice(0, MAX_ENTRIES - 1),
      ]);
    };

    return () => ws.close();
  }, [sessionId]);

  return (
    <div className="rounded-xl border border-border bg-[#0d0d0d] p-4 flex flex-col gap-2 min-h-[220px] font-mono">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] font-bold tracking-widest uppercase text-green-400/70">
          camera log · session {sessionId}
        </span>
      </div>

      {log.length === 0 ? (
        <span className="text-xs text-green-400/30 mt-2">waiting for camera events...</span>
      ) : (
        <div className="flex flex-col gap-0.5">
          {log.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2 text-xs whitespace-nowrap overflow-hidden">
              <span className="text-green-400/40 shrink-0">{entry.ts}</span>
              <span className={entry.color}>{entry.line}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
