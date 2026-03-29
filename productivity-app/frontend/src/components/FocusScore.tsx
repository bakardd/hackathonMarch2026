interface Props {
  score: number;
}

export function FocusScore({ score }: Props) {
  const color =
    score >= 75 ? "text-status-active"
    : score >= 50 ? "text-status-warning"
    : "text-status-danger";

  return (
    <div className="flex flex-col items-center justify-center bg-card border border-border rounded-2xl p-8">
      <span className="text-sm uppercase tracking-widest text-muted-fg mb-2">Focus Score</span>
      <span className={`text-7xl font-black ${color}`}>{score}</span>
      <span className="text-muted-fg text-sm mt-1">/ 100</span>
    </div>
  );
}
