"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BackLink, PageTitle } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { Sheet } from "@/components/ui/sheet";
import { showToast } from "@/components/ui/toast";
import { DISHES } from "@/config/dishes";
import { mealFromTime } from "@/engine/entry";
import { DayPreview } from "@/features/food-sheet/day-preview";
import { nowHHMM } from "@/features/journal/journal";
import { useT } from "@/i18n/use-t";
import { toISODate } from "@/lib/dates";
import type { Meal, Recipe } from "@/lib/db";
import { partMacros, partsLeft, remainingOf, typicalPart } from "./dish";
import { MacroColumns } from "./macro-columns";
import { eatPart } from "./store";
import { useDish, useParts } from "./use-dishes";

const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];

/** « Peser une part » (Figma 9:563, 57:1823) : on pèse sa part, kcal et journée en direct, puis ajout au repas. */
export function WeighPart({ id, date, meal }: { id: string; date: string | null; meal: string | null }) {
  const { t } = useT();
  const dish = useDish(id);
  const parts = useParts(id);
  if (!dish || !parts)
    return (
      <div className="flex flex-col">
        <BackLink href="/recettes/">{t("dishes.back-recipes")}</BackLink>
        <p className="mt-3.5 text-corps text-texte-discret">{t(dish === null ? "dishes.missing" : "dishes.loading")}</p>
      </div>
    );
  const asked = MEALS.includes(meal as Meal) ? (meal as Meal) : mealFromTime(nowHHMM());
  return <PartBody key={dish.id} dish={dish} eaten={parts.map((p) => p.grams)} date={date ?? toISODate(new Date())} startMeal={asked} />;
}

function PartBody({ dish, eaten, date, startMeal }: { dish: Recipe; eaten: number[]; date: string; startMeal: Meal }) {
  const { t, n } = useT();
  const router = useRouter();
  const [meal, setMeal] = useState(startMeal);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  // Départ : la dernière part mangée de ce plat (souvent la même), sinon vide.
  const [grams, setGrams] = useState<number | null>(eaten.at(-1) ?? null);
  const g = t("units.g");
  const left = remainingOf(dish);
  const finished = dish.kind === "batch" && !!dish.finishedAt;
  const m = partMacros(dish, grams ?? 0);
  const after = left === null ? null : Math.max(0, left - (grams ?? 0));
  const estimate = after === null ? null : partsLeft(after, typicalPart(eaten));
  const to = t(`meals-to.${meal}`);

  const add = async () => {
    if (!grams) return;
    setSaving(true);
    const r = await eatPart(dish, date, meal, grams);
    showToast(t(r.finishedAt && !dish.finishedAt ? "dishes.added-finished" : "dishes.added", { to }));
    router.push("/");
  };

  return (
    <div className="flex flex-col">
      <BackLink href={`/recettes/lot/?id=${encodeURIComponent(dish.id)}`}>{dish.name}</BackLink>
      <PageTitle className="mt-3.5">{t("dishes.weigh-part")}</PageTitle>

      <label className="mt-4 flex items-baseline justify-center gap-2 border-b-2 border-actif pb-1.5">
        <span className="sr-only">{t("dishes.part-grams")}</span>
        <input
          inputMode="decimal"
          autoFocus
          value={grams ?? ""}
          placeholder="0"
          onChange={(e) => {
            const v = parseFloat(e.target.value.replace(",", "."));
            setGrams(Number.isFinite(v) && v > 0 ? Math.min(v, DISHES.partMaxG) : null);
          }}
          // Largeur au contenu : le chiffre et « g » restent centrés ensemble.
          style={{ width: `${Math.max(String(grams ?? "").length, 1) + 0.2}ch` }}
          className="num min-w-0 max-w-full bg-transparent text-right text-heros tracking-[-0.04em] outline-none placeholder:text-texte-discret"
        />
        <span className="num text-valeur text-texte-discret">{g}</span>
      </label>
      {after !== null && (
        <p className="mt-2.5 text-center text-petit text-texte-discret">
          {after > 0 ? t("dishes.will-remain", { g: n(after), parts: estimate ? t(`dishes.${estimate.key}`, { n: estimate.n }) : "" }) : t("dishes.will-remain-empty")}
        </p>
      )}

      <h2 className="libelle mt-6">{t("dishes.your-part")}</h2>
      <div className="mt-1.5">
        <MacroColumns
          items={[
            { label: t("dishes.kcal"), value: n(m.kcal) },
            { label: t("dishes.protein"), value: n(m.protein) },
            { label: t("dishes.carbs"), value: n(m.carbs) },
            { label: t("dishes.fat"), value: n(m.fat) },
            { label: t("dishes.fiber"), value: n(m.fiber, 1) },
          ]}
        />
      </div>

      <Row className="mt-7" label={t("dishes.meal")} value={t(`meals.${meal}`)} chevron onClick={() => setPicking(true)} />

      <div className="mt-4">
        <DayPreview date={date} add={m} />
      </div>

      {finished ? (
        <p className="mt-6 text-petit text-texte-discret">{t("dishes.done-dish")}</p>
      ) : (
        <Button className="mt-6" disabled={!grams || saving} onClick={add}>
          {t("dishes.add", { to })}
        </Button>
      )}

      <Sheet open={picking} onClose={() => setPicking(false)} label={t("dishes.meal")}>
        <p className="libelle">{t("dishes.meal")}</p>
        <div className="mt-2">
          {MEALS.map((x) => (
            <Row
              key={x}
              dense
              checked={x === meal}
              label={t(`meals.${x}`)}
              onClick={() => {
                setMeal(x);
                setPicking(false);
              }}
            />
          ))}
        </div>
      </Sheet>
    </div>
  );
}
