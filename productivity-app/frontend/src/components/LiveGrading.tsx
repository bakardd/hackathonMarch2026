import { useSessionStore } from "../store/sessionStore";
import { Eye, Armchair, Droplets } from "lucide-react";

function SignalRow({
  icon,
  label,
  value,
  confidence,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  confidence?: number | null;
  color: "green" | "red" | "yellow" | "muted";
}) {
  const colorMap = {
    green: "text-primary bg-primary/10 border-primary/30",
    red: "text-red-400 bg-red-400/10 border-red-400/30",
    yellow: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    muted: "text-muted-fg bg-card border-border",
  };

  const dotColor = {
    green: "bg-primary",
    red: "bg-red-400",
    yellow: "bg-yellow-400",
    muted: "bg-muted-fg/40",
  };

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${colorMap[color]} transition-colors`}>
      <div className="flex-shrink-0 opacity-70">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor[color]} ${color !== "muted" ? "animate-pulse" : ""}`} />
          <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-sm font-bold">
          {value ?? "Waiting..."}
        </span>
      </div>
      {confidence != null && (
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-fg uppercase">Conf</span>
          <span className="text-xs font-mono font-bold">{Math.round(confidence * 100)}%</span>
        </div>
      )}
    </div>
  );
}

function eyeColor(eyes: string | null): "green" | "red" | "yellow" | "muted" {
  if (!eyes) return "muted";
  if (eyes === "open") return "green";
  if (eyes === "closed") return "yellow";
  return "red"; // away
}

function eyeLabel(eyes: string | null): string {
  if (!eyes) return "Waiting...";
  if (eyes === "open") return "On Screen ✓";
  if (eyes === "closed") return "Eyes Closed";
  return "Looking Away";
}

function postureColor(posture: string | null): "green" | "red" | "yellow" | "muted" {
  if (!posture) return "muted";
  return posture === "good" ? "green" : "red";
}

function postureLabel(posture: string | null): string {
  if (!posture) return "Waiting...";
  return posture === "good" ? "Good ✓" : "Poor — Sit up!";
}

export function LiveGrading() {
  const { signals, confidence } = useSessionStore();

  return (
    <div className="rounded-xl border border-border bg-card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-fg">
          Live Grading
        </span>
      </div>

      <SignalRow
        icon={<Eye className="w-4 h-4" />}
        label="Eyes"
        value={eyeLabel(signals.eyes)}
        confidence={confidence.eyes}
        color={eyeColor(signals.eyes)}
      />

      <SignalRow
        icon={<Armchair className="w-4 h-4" />}
        label="Posture"
        value={postureLabel(signals.posture)}
        confidence={confidence.posture}
        color={postureColor(signals.posture)}
      />

      {signals.drinking && signals.drinking !== "none" && (
        <SignalRow
          icon={<Droplets className="w-4 h-4" />}
          label="Hydration"
          value={`${signals.drinking} detected 💧`}
          color="green"
        />
      )}
    </div>
  );
}
