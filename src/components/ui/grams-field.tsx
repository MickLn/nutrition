"use client";

/** Composant « Saisie » du Figma : 110 px, chiffre à droite, soulignement Klein, unité discrète. */
export function GramsField({ value, onChange, label, unit, autoFocus }: { value: number | null; onChange: (v: number | null) => void; label: string; unit: string; autoFocus?: boolean }) {
  return (
    <label className="flex w-[110px] shrink-0 items-baseline justify-end gap-2 border-b-[1.5px] border-actif pb-1">
      <span className="sr-only">{label}</span>
      <input
        inputMode="decimal"
        autoFocus={autoFocus}
        value={value ?? ""}
        onChange={(e) => {
          const v = parseFloat(e.target.value.replace(",", "."));
          onChange(Number.isFinite(v) && v >= 0 ? v : null);
        }}
        className="num w-full min-w-0 bg-transparent text-right text-moyen outline-none"
      />
      <span className="num text-valeur text-texte-discret">{unit}</span>
    </label>
  );
}
