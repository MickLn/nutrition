"use client";

import { useState } from "react";
import { Button } from "./button";
import { Sheet } from "./sheet";

type ValueSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Titre du panneau (« Taille »). */
  title: string;
  /** Unité affichée à droite du chiffre (« cm »). */
  unit: string;
  value: number;
  /** Bornes acceptées : en dehors, le bouton reste inactif. */
  min: number;
  max: number;
  /** Texte du bouton principal (« Enregistrer »). */
  saveLabel: string;
  onSave: (v: number) => void;
};

/** Panneau Figma « modifier une valeur » : gros chiffre souligné en bleu, unité discrète, bouton principal. */
export function ValueSheet({ open, onClose, title, unit, value, min, max, saveLabel, onSave }: ValueSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} label={title}>
      <ValueForm key={String(open)} title={title} unit={unit} value={value} min={min} max={max} saveLabel={saveLabel} onSave={(v) => { onSave(v); onClose(); }} />
    </Sheet>
  );
}

function ValueForm({ title, unit, value, min, max, saveLabel, onSave }: Omit<ValueSheetProps, "open" | "onClose">) {
  const [text, setText] = useState(String(value).replace(".", ","));
  const v = parseFloat(text.replace(",", "."));
  const valid = Number.isFinite(v) && v >= min && v <= max;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave(v);
      }}
    >
      <h2 className="text-section font-medium">{title}</h2>
      <label className="mt-1.5 flex items-baseline justify-center gap-2 border-b-2 border-actif pb-1.5">
        <span className="sr-only">{title}</span>
        <input
          inputMode="decimal"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="num w-[5ch] min-w-0 bg-transparent text-right text-grand tracking-[-0.02em] outline-none"
          aria-invalid={!valid}
        />
        <span className="num text-valeur text-texte-discret">{unit}</span>
      </label>
      <Button type="submit" disabled={!valid} className="mt-8">
        {saveLabel}
      </Button>
    </form>
  );
}
