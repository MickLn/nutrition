export function CalorieRing({ value, goal }: { value: number; goal: number | null }) {
  const size = 148;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = goal ? Math.min(value / goal, 1) : 0;
  const remaining = goal ? Math.round(goal - value) : null;

  return (
    <div className="relative grid size-[148px] place-items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--chart-kcal)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute text-center">
        <p className="num text-[28px] font-medium leading-none">{remaining ?? Math.round(value)}</p>
        <p className="mt-1 text-xs text-muted">{remaining === null ? "kcal" : remaining >= 0 ? "kcal restantes" : "kcal en trop"}</p>
      </div>
    </div>
  );
}
