"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Chip } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";
import { showToast } from "@/components/ui/toast";
import { UI } from "@/config/ui";
import { useT } from "@/i18n/use-t";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { addWater } from "./water";

/** Brique Eau (Figma « Eau et poids ») : total, un carré par verre, « +250 » ajoute un verre ; tap sur les verres = autres doses. */
export function WaterBlock({ date, goalL }: { date: string; goalL: number | null }) {
  const { t, n } = useT();
  const [open, setOpen] = useState(false);
  const ml = useLiveQuery(async () => (await db.water.where("date").equals(date).toArray()).reduce((a, w) => a + w.ml, 0), [date]) ?? 0;
  const glasses = goalL ? Math.ceil((goalL * 1000) / UI.waterGlassMl) : 0;
  const full = Math.floor(ml / UI.waterGlassMl);

  const add = async (dose: number) => {
    const undo = await addWater(date, dose);
    setOpen(false);
    showToast(t("water.added", { ml: dose }), { label: t("day.undo"), run: undo });
  };

  return (
    <div className="flex flex-1 flex-col gap-2 py-4 pr-[14px]">
      <h2 className="libelle">{t("water.title")}</h2>
      <p className="num flex items-baseline gap-1.5">
        <span className="text-moyen">{n(ml / 1000, 2)}</span>
        {goalL !== null && <span className="text-mono-petit text-texte-discret">{t("water.of-goal", { goal: n(goalL, 1) })}</span>}
      </p>
      {glasses > 0 && (
        <button onClick={() => setOpen(true)} className="tap flex gap-1" aria-label={t("water.add")}>
          {Array.from({ length: glasses }, (_, i) => (
            <span key={i} className={cn("size-3.5 rounded-[3px]", i < full ? "bg-eau" : "bg-piste")} />
          ))}
        </button>
      )}
      <button onClick={() => add(UI.waterQuickMl)} className="tap num self-start text-valeur text-actif" aria-label={t("water.added", { ml: UI.waterQuickMl })}>
        +{UI.waterQuickMl}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} label={t("water.title")}>
        <p className="libelle">{t("water.title")}</p>
        <p className="num mt-1.5 flex items-baseline gap-1.5">
          <span className="text-grand">{n(ml / 1000, 2)}</span>
          {goalL !== null && <span className="text-valeur text-texte-discret">{t("water.of-goal", { goal: n(goalL, 1) })}</span>}
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {UI.waterDoses.map((d) => (
            <Chip key={d} onClick={() => add(d)}>
              {d} {t("units.ml")}
            </Chip>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
