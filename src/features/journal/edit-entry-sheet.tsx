"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { GramsField } from "@/components/ui/grams-field";
import { Sheet } from "@/components/ui/sheet";
import { showToast } from "@/components/ui/toast";
import { useT } from "@/i18n/use-t";
import type { LogEntry } from "@/lib/db";
import { forGrams } from "@/lib/nutrition";
import { removeEntry, setGrams } from "./journal";
import { usePortions } from "./use-portions";

/** Panneau « Modifier une saisie » : quantité, valeurs en direct, Retirer (avec Annuler) ou Enregistrer. */
export function EditEntrySheet({ entry, onClose }: { entry: LogEntry | null; onClose: () => void }) {
  const { t } = useT();
  return (
    <Sheet open={!!entry} onClose={onClose} label={entry?.name ?? t("sheet.close")}>
      {entry && <EditBody key={entry.id} entry={entry} onClose={onClose} />}
    </Sheet>
  );
}

function EditBody({ entry, onClose }: { entry: LogEntry; onClose: () => void }) {
  const { t, n } = useT();
  const [grams, setG] = useState<number | null>(entry.grams);
  const { shortcut } = usePortions(entry.refId);
  const m = forGrams(entry.snapshot, grams ?? 0);
  const chips = [...new Set([shortcut, entry.grams].filter((g): g is number => !!g))];

  return (
    <div>
      <p className="libelle">
        {t(`meals.${entry.meal}`)}, {entry.time}
      </p>
      <h2 className="mt-1.5 text-section [overflow-wrap:anywhere]">{entry.name}</h2>
      <div className="mt-3.5">
        <GramsField value={grams} onChange={setG} label={t("add.grams")} unit={t("units.g")} />
      </div>
      {chips.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {chips.map((g) => (
            <Chip key={g} selected={grams === g} onClick={() => setG(g)}>
              {n(g)} {t("units.g")}
            </Chip>
          ))}
        </div>
      )}
      <p className="mt-5 flex items-baseline gap-1.5">
        <span className="num text-grand tracking-[-0.02em]">{n(m.kcal)}</span>
        <span className="num text-valeur text-texte-discret">{t("units.kcal")}</span>
      </p>
      <dl className="mt-4 grid grid-cols-4 gap-2">
        {(["protein", "carbs", "fat", "fiber"] as const).map((k) => (
          <div key={k} className="min-w-0">
            <dt className="libelle truncate">{t(`day.${k}`)}</dt>
            <dd className="num mt-0.5 text-valeur">
              {n(m[k], 1)} {t("units.g")}
            </dd>
          </div>
        ))}
      </dl>
      <Button
        className="mt-8 w-full"
        disabled={!grams}
        onClick={async () => {
          if (grams) await setGrams(entry.id, grams);
          onClose();
        }}
      >
        {t("edit.save")}
      </Button>
      <button
        className="mt-1 flex min-h-11 w-full items-center justify-center text-corps text-actif underline"
        onClick={async () => {
          const undo = await removeEntry(entry.id);
          onClose();
          showToast(t("day.removed", { from: t(`meals-from.${entry.meal}`) }), { label: t("day.undo"), run: undo });
        }}
      >
        {t("edit.remove")}
      </button>
    </div>
  );
}
