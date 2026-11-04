"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { FoodSearch } from "@/features/add/food-search";
import { usePresetFood } from "@/features/food-sheet/load";
import { MealPicker } from "@/features/add/meal-picker";
import { WeighRow, type Weighed } from "@/features/add/weigh-list";
import { addEntries, nowHHMM } from "@/features/journal/journal";
import { scannerHref } from "@/features/scanner/links";
import { ScanButton } from "@/features/scanner/scan-button";
import { mealFromTime } from "@/engine/entry";
import { useT } from "@/i18n/use-t";
import { toISODate } from "@/lib/dates";
import type { Meal } from "@/lib/db";
import { addCore, forGrams, ZERO } from "@/lib/nutrition";

const MEALS = ["breakfast", "lunch", "dinner", "snack"];

export default function AddPage() {
  return (
    <Suspense>
      <AddFlow />
    </Suspense>
  );
}

/** Saisie : 1) chercher et cocher plusieurs aliments, 2) peser chacun, 3) ajouter au repas. */
function AddFlow() {
  const { t, n } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const date = params.get("date") ?? toISODate(new Date());
  const asked = params.get("meal");
  const [meal, setMeal] = useState<Meal>(asked && MEALS.includes(asked) ? (asked as Meal) : mealFromTime(nowHHMM()));
  const [items, setItems] = useState<Weighed[]>([]);
  const [step, setStep] = useState<"search" | "weigh">("search");
  // « ?food=<id> » (aliment tout juste créé) : on arrive à la pesée avec cet aliment choisi.
  const preset = usePresetFood(params.get("food"));
  const [presetDone, setPresetDone] = useState(false);
  if (preset && !presetDone) {
    setPresetDone(true);
    setItems([{ food: preset, grams: null }]);
    setStep("weigh");
  }

  const toggle = (food: Weighed["food"]) =>
    setItems((xs) => (xs.some((x) => x.food.id === food.id) ? xs.filter((x) => x.food.id !== food.id) : [...xs, { food, grams: null }]));
  const total = items.reduce((acc, i) => addCore(acc, forGrams(i.food.per100g, i.grams ?? 0)), ZERO);
  const ready = items.some((i) => i.grams);

  return (
    <div className="pb-24">
      {step === "search" ? (
        <div className="flex items-center justify-between gap-3">
          <MealPicker meal={meal} onChange={setMeal} />
          <Link href="/" className="tap text-corps text-actif">
            {t("add.cancel")}
          </Link>
        </div>
      ) : (
        <>
          <button onClick={() => setStep("search")} className="tap text-petit text-actif">
            ‹ {t("add.back")}
          </button>
          <div className="mt-3.5">
            <MealPicker meal={meal} onChange={setMeal} />
          </div>
        </>
      )}

      <div className="mt-3.5">
        {step === "search" ? (
          <FoodSearch selected={items.map((i) => i.food)} onToggle={toggle} action={<ScanButton date={params.get("date")} meal={meal} />}
            noResultActions={
              <Link href={scannerHref({ date: params.get("date"), meal })} className={buttonVariants({ variant: "secondary", className: "w-full" })}>
                {t("scanner.open")}
              </Link>
            }
          />
        ) : (
          <>
            {items.map((it) => (
              <WeighRow key={it.food.id} item={it} onChange={(w) => setItems((xs) => xs.map((x) => (x.food.id === w.food.id ? w : x)))} />
            ))}
            <div className="flex items-center justify-between gap-3 pt-3.5">
              <span className="text-petit">{t("add.total")}</span>
              <span className="num text-mono-petit">{t("add.total-value", { kcal: n(total.kcal), protein: n(total.protein) })}</span>
            </div>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-fond pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-md px-[22px]">
          {step === "search" ? (
            <Button className="w-full" disabled={!items.length} onClick={() => setStep("weigh")}>
              {t("add.weigh", { n: items.length })}
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={!ready}
              onClick={async () => {
                await addEntries(date, meal, items.filter((i) => i.grams).map((i) => ({ food: i.food, grams: i.grams! })));
                router.push("/");
              }}
            >
              {t("add.to-meal", { to: t(`meals-to.${meal}`) })}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
