"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { GramsField } from "@/components/ui/grams-field";
import { Sheet } from "@/components/ui/sheet";
import { UI } from "@/config/ui";
import { useT } from "@/i18n/use-t";
import { addWeight } from "./weight";
import type { BodyState } from "./use-targets";

/** Brique Poids : moyenne 7 jours, évolution, alerte douce si pas de pesée. Tap = noter le poids. */
export function WeightBlock({ body, today, open, setOpen }: { body: BodyState | undefined; today: string; open: boolean; setOpen: (v: boolean) => void }) {
  const { t, n } = useT();
  return (
    <div className="flex flex-1 flex-col gap-1 py-4 pl-[14px]">
      <button onClick={() => setOpen(true)} className="flex flex-col gap-1 text-left" aria-label={t("weight.note")}>
        <h2 className="libelle">{t("weight.title")}</h2>
        <p className="num flex items-baseline gap-1.5">
          <span className="text-moyen">{body?.avgKg != null ? n(body.avgKg, 1) : "–"}</span>
          <span className="text-mono-petit text-texte-discret">{t("weight.unit")}</span>
        </p>
      </button>
      {body && body.status !== "ok" && body.daysSince !== null && <Alert>{t("weight.late", { n: body.daysSince })}</Alert>}
      <Sheet open={open} onClose={() => setOpen(false)} label={t("weight.note")}>
        <WeightForm today={today} onDone={() => setOpen(false)} />
      </Sheet>
    </div>
  );
}


/** Formulaire « Noter le poids », aussi ouvert depuis Réglages › Poids et Apple Santé. */
export function WeightForm({ today, onDone }: { today: string; onDone: () => void }) {
  const { t } = useT();
  const [kg, setKg] = useState<number | null>(null);
  return (
    <div>
      <p className="libelle">{t("weight.note")}</p>
      <div className="mt-4">
        <GramsField value={kg} onChange={setKg} label={t("weight.title")} unit={t("weight.unit")} autoFocus />
      </div>
      <Button
        className="mt-6 w-full"
        disabled={!kg || kg < UI.weightKg.min || kg > UI.weightKg.max}
        onClick={async () => {
          await addWeight(today, kg!);
          onDone();
        }}
      >
        {t("weight.save")}
      </Button>
    </div>
  );
}
