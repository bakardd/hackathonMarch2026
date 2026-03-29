interface StatusIndicatorProps {
  isActive: boolean;
  /** Custom label to display (e.g. "Eyes on screen ✓") */
  label?: string;
  /** Whether current status is "good" — drives dot color */
  ok?: boolean;
}

export function StatusIndicator({ isActive, label, ok }: StatusIndicatorProps) {
  const dotColor = !isActive
    ? "bg-status-idle"
    : ok !== false
    ? "bg-status-active animate-pulse-ring"
    : "bg-status-danger animate-pulse";

  const text = label ?? (isActive ? "Monitoring Active" : "System Idle");

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
      <span className={`w-3 h-3 rounded-full shrink-0 ${dotColor}`} />
      <span className="text-sm font-medium text-fg">{text}</span>
    </div>
  );
}
