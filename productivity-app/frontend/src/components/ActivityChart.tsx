import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export interface DataPoint {
  time: string;
  posture: number;
  attention: number;
}

interface ActivityChartProps {
  data: DataPoint[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 min-h-[220px]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest uppercase text-muted-fg">Activity Chart</span>
        <div className="flex items-center gap-4 text-xs text-muted-fg">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-primary inline-block rounded" /> Posture
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-primary/50 inline-block rounded" /> Attention
          </span>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-muted-fg">Waiting for data...</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220 40% 10%)",
                border: "1px solid hsl(220 30% 18%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Line type="monotone" dataKey="posture" stroke="hsl(145 80% 42%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="attention" stroke="hsl(145 80% 42% / 0.5)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
