"use client";

import { cn } from "@/lib/utils";

/**
 * Composant « Champ » du Figma (6:65 Texte, 6:68 Chiffre) : libellé Mono majuscules, valeur dessous, trait Klein de 2 px.
 * Un champ facultatif vide montre son exemple en discret.
 */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  number,
  invalid,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Type « Chiffre » : Geist Mono 20, clavier numérique. */
  number?: boolean;
  invalid?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1.5 border-b-2 border-actif py-3", className)}>
      <span className="libelle">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={number ? "decimal" : undefined}
        autoComplete="off"
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full min-w-0 bg-transparent outline-none placeholder:text-texte-discret",
          number ? "num text-moyen" : "text-corps",
        )}
      />
    </label>
  );
}
