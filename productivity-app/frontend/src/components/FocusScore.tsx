interface Props {
  score: number;
}

export function FocusScore({ score }: Props) {
  const color =
    score >= 75 ? "text-green-400"
    : score >= 50 ? "text-yellow-400"
    : "text-red-400";

  return (
    <div className="flex flex-col items-center justify-center bg-gray-800 rounded-2xl p-8">
      <span className="text-sm uppercase tracking-widest text-gray-500 mb-2">Focus Score</span>
      <span className={`text-7xl font-black ${color}`}>{score}</span>
      <span className="text-gray-500 text-sm mt-1">/ 100</span>
    </div>
  );
}
