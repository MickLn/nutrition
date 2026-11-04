"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { PageTitle } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { showToast } from "@/components/ui/toast";
import { mealFromTime } from "@/engine/entry";
import { ciqualFoods, fromCustom } from "@/features/foods/catalog";
import { deleteFood, saveFood } from "@/features/foods/store";
import type { FoodItem } from "@/features/foods/types";
import { addEntries, nowHHMM } from "@/features/journal/journal";
import { usePortions } from "@/features/journal/use-portions";
import { useT } from "@/i18n/use-t";
import { db, type Food, type Meal } from "@/lib/db";
import { forGrams } from "@/lib/nutrition";
import { BackButton } from "./back-button";
import { DayPreview } from "./day-preview";
import { useFood } from "./load";
import { initialGrams, quantityChips, type QuantityChip } from "./sheet";
import { similarFoods } from "./vary";

export type SheetFrom = "journal" | "add";
const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];

type SheetProps = { id: string; date: string; entryGrams: number | null; from: SheetFrom | null; meal: string | null };

/** Fiche d'un aliment (Figma 7:315 et 57:1483). */
export function FoodSheet(props: SheetProps) {
  const { t } = useT();
  const found = useFood(props.id);
  const back = <BackButton>{t(props.from === "journal" ? "food.back-journal" : props.from === "add" ? "food.back-add" : "food.back")}</BackButton>;
  if (!found)
    return (
      <div className="flex flex-col">
        {back}
        <p className="mt-3.5 text-corps text-texte-discret">{t(found === null ? "food.missing" : "food.loading")}</p>
      </div>
    );
  // La clé remet la quantité choisie à zéro quand on passe à un aliment proche.
  return <SheetBody key={props.id} {...props} item={found.item} food={found.food} back={back} />;
}

function SheetBody({ item, food, back, date, entryGrams, from, meal: askedMeal }: SheetProps & { item: FoodItem; food?: Food; back: React.ReactNode }) {
  const { t, n, lang } = useT();
  const router = useRouter();
  const { shortcut } = usePortions(item.id);
  const [picked, setPicked] = useState<string | null>(null);
  const [similar, setSimilar] = useState<FoodItem[]>([]);
  const meal: Meal = askedMeal && MEALS.includes(askedMeal as Meal) ? (askedMeal as Meal) : mealFromTime(nowHHMM());
  const opts = { entryGrams, usual: shortcut, portions: item.portions };
  const chips = quantityChips(opts);
  const chipKey = (c: QuantityChip) => `${c.grams}-${c.label ?? ""}`;
  const start = initialGrams(opts);
  const chosen = chips.find((c) => chipKey(c) === picked) ?? chips.find((c) => c.grams === start && !c.label) ?? chips.find((c) => c.grams === start);
  const grams = chosen?.grams ?? start;
  const m = forGrams(item.per100g, grams);

  useEffect(() => {
    let alive = true;
    Promise.all([ciqualFoods(lang), db.foods.toArray()])
      .then(([ciqual, custom]) => alive && setSimilar(similarFoods(item, [...custom.map(fromCustom), ...ciqual])))
      .catch(() => alive && setSimilar([]));
    return () => {
      alive = false;
    };
  }, [item, lang]);

  const sheetHref = (id: string) => {
    const q = new URLSearchParams({ id, g: String(grams), date });
    if (from) q.set("from", from);
    if (askedMeal) q.set("meal", askedMeal);
    return `/aliment/?${q}`;
  };

  const remove = async () => {
    if (!food) return;
    await deleteFood(food.id);
    // On reste sur la page (« Cet aliment n'existe plus ») : « Annuler » remet l'aliment et la fiche revient.
    showToast(t("food.deleted"), { label: t("food.undo"), run: () => void saveFood(food) });
  };

  return (
    <div className="flex flex-col">
      {back}
      <PageTitle className="mt-3.5">{food?.name ?? item.name}</PageTitle>
      {food?.brand && <p className="libelle mt-1.5 [overflow-wrap:anywhere]">{food.brand}</p>}

      <p className={`num flex items-baseline gap-2 ${food?.brand ? "mt-3.5" : "mt-5"}`}>
        <span className="text-grand tracking-[-0.02em]">{n(m.kcal)}</span>
        <span className="text-valeur text-texte-discret">{t("units.kcal")}</span>
      </p>

      <div role="group" aria-label={t("food.quantity")} className="mt-3.5 flex flex-wrap gap-2">
        {chips.map((c) => (
          <Chip key={chipKey(c)} selected={c === chosen} onClick={() => setPicked(chipKey(c))}>
            {c.label ?? `${n(c.grams)} ${t("units.g")}`}
          </Chip>
        ))}
      </div>

      <div className="mt-[18px]">
        {(["protein", "carbs", "fat", "fiber"] as const).map((k) =>
          k === "protein" ? (
            <Row key={k} label={<span className="text-actif">{t(`day.${k}`)}</span>} value={<span className="text-actif">{n(m[k], 1)} {t("units.g")}</span>} />
          ) : (
            <Row key={k} label={t(`day.${k}`)} value={`${n(m[k], 1)} ${t("units.g")}`} />
          ),
        )}
      </div>

      {shortcut && <p className="mt-8 text-petit">{t("food.usual", { n: n(shortcut) })}</p>}

      {food && (
        <div className="mt-4 flex flex-wrap gap-x-4 text-petit text-actif">
          <Link href={`/ajouter/aliment/?id=${encodeURIComponent(food.id)}`} className="tap underline">
            {t("food.edit")}
          </Link>
          <button onClick={remove} className="tap underline">
            {t("food.delete")}
          </button>
        </div>
      )}

      {similar.length > 0 && (
        <section className="mt-8">
          <h2 className="libelle">{t("food.vary")}</h2>
          <div className="mt-0.5">
            {similar.map((s) => {
              const v = forGrams(s.per100g, grams);
              return (
                <Row
                  key={s.id}
                  href={sheetHref(s.id)}
                  label={s.name}
                  detail={t("food.vary-detail", { g: n(grams), kcal: n(v.kcal), protein: n(v.protein, 1) })}
                  chevron
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Ce que l'aliment apporte à la journée : composant Figma « Aperçu journée », posé sur les écrans d'ajout. */}
      <div className="mt-6">
        <DayPreview date={date} add={m} />
      </div>

      <Button
        className="mt-6"
        onClick={async () => {
          await addEntries(date, meal, [{ food: item, grams }]);
          showToast(t("food.added", { to: t(`meals-to.${meal}`) }));
          router.push("/");
        }}
      >
        {t("food.add", { to: t(`meals-to.${meal}`) })}
      </Button>
    </div>
  );
}
