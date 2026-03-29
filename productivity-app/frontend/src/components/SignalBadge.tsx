interface Props {
  label: string;
  value: string | null;
  goodValues: string[];
}

export function SignalBadge({ label, value, goodValues }: Props) {
  const isGood = value ? goodValues.includes(value) : null;
  const color =
    isGood === null ? "bg-gray-700 text-gray-400"
    : isGood ? "bg-green-900 text-green-300"
    : "bg-red-900 text-red-300";

  return (
    <div className={`rounded-xl px-4 py-3 flex flex-col gap-1 ${color}`}>
      <span className="text-xs uppercase tracking-widest opacity-60">{label}</span>
      <span className="text-lg font-semibold capitalize">{value ?? "—"}</span>
    </div>
  );
}
