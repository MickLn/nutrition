"use client";

import { cn } from "@/lib/utils";

/**
 * Composant « Onglet » du Figma (109:11), en rangée : texte 16 à gauche, actif en bleu avec un trait de 2 px,
 * inactif en discret avec un trait fin. Chaque onglet porte son trait (pas de trait sur la rangée).
 * Sert seulement à changer de section (Recettes) ; pour choisir une valeur, voir FilterGroup.
 */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
  label,
  idPrefix,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  /** Préfixe des id : l'onglet `${idPrefix}-tab-<valeur>` commande le panneau `${idPrefix}-panel-<valeur>`. */
  idPrefix: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex items-start">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${o.value}`}
            aria-selected={on}
            aria-controls={`${idPrefix}-panel-${o.value}`}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex h-11 min-w-0 flex-1 items-center text-left text-corps [overflow-wrap:anywhere]",
              on ? "border-b-2 border-actif text-actif" : "border-b border-trait text-texte-discret",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Contenu d'un onglet, relié à son onglet pour les lecteurs d'écran. */
export function TabPanel({ idPrefix, value, children, className }: { idPrefix: string; value: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="tabpanel" id={`${idPrefix}-panel-${value}`} aria-labelledby={`${idPrefix}-tab-${value}`} className={className}>
      {children}
    </div>
  );
}
