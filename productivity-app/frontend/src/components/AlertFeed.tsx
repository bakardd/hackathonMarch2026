import { X } from "lucide-react";

export interface Alert {
  id: string;
  message: string;
  type: "info" | "warning" | "danger";
  time: string;
}

const TYPE_EMOJI: Record<Alert["type"], string> = {
  danger: "👀",
  warning: "🏋",
  info: "💤",
};

interface AlertFeedProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
}

export function AlertFeed({ alerts, onDismiss }: AlertFeedProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 min-h-[200px]">
      <span className="text-xs font-semibold tracking-widest uppercase text-muted-fg">Alert Feed</span>
      {alerts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-muted-fg">No alerts — all systems nominal</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px]">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`text-xs px-3 py-2.5 rounded-md border flex items-start justify-between gap-2 ${
                alert.type === "danger"
                  ? "border-status-danger/30 text-status-danger bg-status-danger/10"
                  : alert.type === "warning"
                  ? "border-status-warning/30 text-status-warning bg-status-warning/10"
                  : "border-border text-muted-fg"
              }`}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span>
                  {TYPE_EMOJI[alert.type]} {alert.message}
                </span>
                <span className="font-mono text-[10px] opacity-60">{alert.time}</span>
              </div>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
