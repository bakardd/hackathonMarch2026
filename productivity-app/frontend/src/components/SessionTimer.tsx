import { useEffect, useState } from "react";

interface SessionTimerProps {
  isRunning: boolean;
  /** If provided, counts down from this value in seconds; otherwise counts up */
  totalSeconds?: number;
}

export function SessionTimer({ isRunning, totalSeconds }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const display = totalSeconds != null ? Math.max(0, totalSeconds - elapsed) : elapsed;
  const mins = Math.floor(display / 60).toString().padStart(2, "0");
  const secs = (display % 60).toString().padStart(2, "0");

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <span className="text-xs font-semibold tracking-widest uppercase text-muted-fg">
        {totalSeconds != null ? "Time Remaining" : "Session Time"}
      </span>
      <div className="text-4xl font-mono font-bold tracking-wider mt-2 text-fg">
        {mins}:{secs}
      </div>
    </div>
  );
}
