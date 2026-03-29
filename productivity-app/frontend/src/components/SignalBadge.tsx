interface Props {
  label: string;
  value: string | null;
  goodValues: string[];
}

export function SignalBadge({ label, value, goodValues }: Props) {
  const isGood = value ? goodValues.includes(value) : null;
  const color =
    isGood === null ? "bg-secondary text-muted-fg"
    : isGood ? "bg-status-active/15 text-status-active border border-status-active/30"
    : "bg-status-danger/15 text-status-danger border border-status-danger/30";

  return (
    <div className={`rounded-xl px-4 py-3 flex flex-col gap-1 ${color}`}>
      <span className="text-xs uppercase tracking-widest opacity-60">{label}</span>
      <span className="text-lg font-semibold capitalize">{value ?? "—"}</span>
    </div>
  );
}
