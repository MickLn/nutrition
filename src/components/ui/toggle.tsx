"use client";

import { cn } from "@/lib/utils";

/** Composant « Interrupteur » du Figma : bascule carrée 46 × 28, curseur carré, Klein quand allumé. */
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn("tap relative h-7 w-[46px] shrink-0 rounded-base transition-colors", on ? "bg-actif" : "bg-piste")}
    >
      <span className={cn("absolute top-1 size-5 rounded-[2px] bg-fond transition-[left]", on ? "left-[22px]" : "left-1")} />
    </button>
  );
}
