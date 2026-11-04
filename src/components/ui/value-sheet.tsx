"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Sheet } from "./sheet";

type ValueSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Titre du panneau (« Taille »). */
  title: string;
  /** Unité affichée à droite du chiffre (« cm »). */
  unit: string;
  /** Phrase d'aide sous le titre (« Au nombril, le matin. »). */
  hint?: string;
  /** Phrase sous le chiffre (« la dernière fois 85,0 cm, jeudi 9 oct. »). */
  note?: string;
  value: number;
  /** Bornes acceptées : en dehors, le bouton reste inactif. */
  min: number;
  /** Borne haute acceptée. */
  max: number;
  /** Texte du bouton principal (« Enregistrer »). */
  saveLabel: string;
  onSave: (v: number) => void;
};

/** Panneau Figma « modifier une valeur » : gros chiffre souligné en bleu, unité discrète, bouton principal. */
export function ValueSheet({ open, onClose, title, unit, hint, note, value, min, max, saveLabel, onSave }: ValueSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} label={title}>
      <ValueForm key={String(open)} title={title} unit={unit} hint={hint} note={note} value={value} min={min} max={max} saveLabel={saveLabel} onSave={(v) => { onSave(v); onClose(); }} />
    </Sheet>
  );
}

function ValueForm({ title, unit, hint, note, value, min, max, saveLabel, onSave }: Omit<ValueSheetProps, "open" | "onClose">) {
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
      {hint && <p className="mt-1.5 text-petit text-texte-discret">{hint}</p>}
      <label className={cn("flex items-baseline justify-center gap-2 border-b-2 border-actif pb-1.5", hint ? "mt-[18px]" : "mt-1.5")}>
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
      {note && <p className="mt-2.5 text-center text-petit text-texte-discret">{note}</p>}
      <Button type="submit" disabled={!valid} className={note ? "mt-[22px]" : "mt-8"}>
        {saveLabel}
      </Button>
    </form>
  );
}
