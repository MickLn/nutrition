"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { BackLink } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { showToast } from "@/components/ui/toast";
import { PROTEIN } from "@/config/protein";
import { mealFromTime } from "@/engine/entry";
import { useBody } from "@/features/body/use-targets";
import { ciqualFoods, fromCustom } from "@/features/foods/catalog";
import type { FoodItem } from "@/features/foods/types";
import { addEntries, nowHHMM, recentFoods } from "@/features/journal/journal";
import { useT } from "@/i18n/use-t";
import { toISODate } from "@/lib/dates";
import { db } from "@/lib/db";
import { sumMacros } from "@/lib/nutrition";
import { isLate, suggestFoods } from "./suggest";

/** Écran « Tap sur la jauge protéines » : ce qui reste à trouver et des aliments habituels qui le comblent. */
export function ProteinPage({ date }: { date: string }) {
  const { t, n, lang } = useT();
  const today = toISODate(new Date());
  const body = useBody(today);
  const [now, setNow] = useState(nowHHMM());
  useEffect(() => {
    const id = setInterval(() => setNow(nowHHMM()), 60_000);
    return () => clearInterval(id);
  }, []);

  const entries = useLiveQuery(() => db.logEntries.where("date").equals(date).toArray(), [date]);
  const own = useLiveQuery(async () => {
    const [recents, custom] = await Promise.all([recentFoods(PROTEIN.recentsScan), db.foods.toArray()]);
    return [...recents, ...custom.map(fromCustom)] as FoodItem[];
  }, []);
  const [catalog, setCatalog] = useState<FoodItem[]>([]);
  useEffect(() => {
    // Hors ligne ou fichier absent : le catalogue ne sert qu'à compléter.
    ciqualFoods(lang).then(setCatalog, () => {});
  }, [lang]);

  const target = body?.targets?.protein ?? null;
  const gap = target !== null && entries ? target - sumMacros(entries).protein : null;
  // Le soir n'a de sens que pour aujourd'hui : un jour passé se regarde comme en journée.
  const late = date === today && isLate(now);
  const list = gap !== null && gap > 0 && own ? suggestFoods(gap, own, catalog, late) : [];

  return (
    <div className="flex flex-col">
      <BackLink href="/">{t("nav.journal")}</BackLink>
      <h1 className="libelle mt-[18px] !text-actif">{t("day.protein")}</h1>
      {gap === null || gap <= 0 ? (
        <p className="mt-4 text-corps">{target === null ? t("day.suggest-no-goal") : t("day.suggest-done")}</p>
      ) : (
        <>
          <p className="num mt-1.5 flex items-baseline gap-2">
            <span className="text-grand tracking-[-0.02em]">{n(gap)}</span>
            <span className="text-valeur text-texte-discret">{t("day.to-find")}</span>
          </p>
          {late && <p className="mt-2.5 text-petit text-texte-discret">{t("day.suggest-late")}</p>}
          {list.length === 0 && own && <p className="mt-5 text-petit text-texte-discret">{t("day.suggest-none")}</p>}
          <ul className="mt-5">
            {list.map((s) => (
              <li key={s.food.id}>
                <Row
                  label={s.food.name}
                  detail={t("day.suggest-line", { g: n(s.grams), kcal: n(s.kcal) })}
                  value={<span className="text-actif">{t("day.suggest-gain", { n: n(s.protein) })}</span>}
                  onClick={async () => {
                    // Créneau d'après l'heure (aujourd'hui) ; un jour passé reçoit la saisie à l'heure actuelle aussi.
                    const meal = mealFromTime(now);
                    const rows = await addEntries(date, meal, [{ food: s.food, grams: s.grams }]);
                    showToast(t("day.suggest-added", { name: s.food.name, to: t(`meals-to.${meal}`) }), {
                      label: t("day.undo"),
                      run: () => void db.logEntries.bulkDelete(rows.map((r) => r.id)),
                    });
                  }}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
