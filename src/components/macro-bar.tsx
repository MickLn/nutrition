export function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number | null; color: string }) {
  const ratio = goal ? Math.min(value / goal, 1) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="num text-[13px]">
          {Math.round(value)}
          {goal ? <span className="text-muted">/{Math.round(goal)}g</span> : "g"}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${ratio * 100}%`, background: color }} />
      </div>
    </div>
  );
}
