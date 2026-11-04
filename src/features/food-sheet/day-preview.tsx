"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Gauge } from "@/components/ui/gauge";
import { useBody } from "@/features/body/use-targets";
import { useT } from "@/i18n/use-t";
import { toISODate } from "@/lib/dates";
import { db } from "@/lib/db";
import { addCore, sumMacros, type Core } from "@/lib/nutrition";

/** Composant Figma « Aperçu journée » (57:1897) : ce que donne la journée si on ajoute la quantité choisie. */
export function DayPreview({ date, add }: { date: string; add: Core }) {
  const { t, n } = useT();
  const entries = useLiveQuery(() => db.logEntries.where("date").equals(date).toArray(), [date]);
  const targets = useBody(toISODate(new Date()))?.targets ?? null;
  if (!entries) return null;
  const total = addCore(sumMacros(entries), add);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="libelle">{t("food.day")}</h2>
      <p className="flex items-baseline gap-1.5">
        <span className="text-petit">{t("food.calories")}</span>
        <span className="num text-valeur">{n(total.kcal)}</span>
        {targets && <span className="min-w-0 flex-1 text-petit text-texte-discret">{t("food.of-kcal", { n: n(targets.kcal) })}</span>}
      </p>
      <Gauge value={total.kcal} max={targets?.kcal ?? null} tone="signal" />
      <p className="flex items-baseline gap-1.5">
        <span className="min-w-0 flex-1 text-petit">{t("food.protein")}</span>
        <span className="num text-valeur">{n(total.protein)}</span>
        {targets && <span className="text-petit text-texte-discret">{t("food.of-g", { n: n(targets.protein) })}</span>}
      </p>
      <Gauge value={total.protein} max={targets?.protein ?? null} tone="actif" />
      <div className="flex gap-4 pt-2">
        {(["carbs", "fat", "fiber"] as const).map((k) => (
          <div key={k} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h3 className="libelle truncate">{t(`day.${k}`)}</h3>
            <p className="num flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-moyen">{n(total[k])}</span>
              <span className="text-mono-petit text-texte-discret">{targets ? t("food.of-g", { n: n(targets[k]) }) : t("units.g")}</span>
            </p>
            <Gauge value={total[k]} max={targets?.[k] ?? null} />
          </div>
        ))}
      </div>
    </section>
  );
}
