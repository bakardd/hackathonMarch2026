interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon?: string;
}

export function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest uppercase text-muted-fg">{title}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <span className="text-2xl font-bold font-mono text-primary">{value}</span>
      <span className="text-xs text-muted-fg">{subtitle}</span>
    </div>
  );
}
