"use client";

import { cn } from "@/lib/utils";

/** Composant « Filtre » + « Sélecteur » du Figma : petits repères Geist Mono majuscules, choisi en bleu léger. Un seul composant pour choisir une valeur. */
export function FilterGroup<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex shrink-0 gap-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "tap num flex h-8 items-center rounded-base px-2.5 text-mono-petit uppercase tracking-[0.08em]",
              on ? "bg-actif-leger font-medium text-actif" : "text-texte-discret",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
