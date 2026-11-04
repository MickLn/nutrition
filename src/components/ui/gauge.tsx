import { cn } from "@/lib/utils";

/** Jauge « Jauge » du Figma : 6 px, rayon 3 px, piste visible même vide. `tone` = token de couleur du remplissage. */
export function Gauge({ value, max, tone = "texte-discret", className }: { value: number; max: number | null; tone?: "signal" | "actif" | "texte-discret" | "eau"; className?: string }) {
  const ratio = max ? Math.min(Math.max(value / max, 0), 1) : 0;
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-[3px] bg-piste", className)} aria-hidden>
      <div className="h-full rounded-[3px] transition-[width] duration-500" style={{ width: `${ratio * 100}%`, background: `var(--${tone})` }} />
    </div>
  );
}
