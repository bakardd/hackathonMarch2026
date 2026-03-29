import { useEffect, useState } from "react";

interface ScoreRingProps {
  score: number;
  maxScore: number;
  label: string;
  size?: number;
}

export function ScoreRing({ score, maxScore, label, size = 140 }: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / maxScore) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const color =
    score >= 75 ? "var(--color-score-ring)"
    : score >= 50 ? "var(--color-status-warning)"
    : "var(--color-status-danger)";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-score-ring-bg)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-mono text-primary">{animatedScore}</span>
          <span className="text-xs text-muted-fg">/ {maxScore}</span>
        </div>
      </div>
      <span className="text-xs font-semibold tracking-widest uppercase text-muted-fg">{label}</span>
    </div>
  );
}
