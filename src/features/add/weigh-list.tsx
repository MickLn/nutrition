"use client";

import { Chip } from "@/components/ui/chip";
import { GramsField } from "@/components/ui/grams-field";
import type { FoodItem } from "@/features/foods/types";
import { usePortions } from "@/features/journal/use-portions";
import { useT } from "@/i18n/use-t";
import { forGrams } from "@/lib/nutrition";

export type Weighed = { food: FoodItem; grams: number | null; confirmed?: boolean };

/** Une ligne par aliment choisi : quantité, raccourci de portion, kcal en direct, alerte neutre. */
export function WeighRow({ item, onChange }: { item: Weighed; onChange: (w: Weighed) => void }) {
  const { t, n } = useT();
  const { shortcut, check } = usePortions(item.food.id);
  const kcal = forGrams(item.food.per100g, item.grams ?? 0).kcal;
  const chips = [...new Set([shortcut, ...item.food.portions.map((p) => p.grams)].filter((g): g is number => !!g))];
  const alert = item.grams && !item.confirmed && check(item.grams) === "check";

  return (
    <div className="pb-3.5 pt-3.5 first:pt-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="min-w-0 flex-1 text-petit [overflow-wrap:anywhere]">{item.food.name}</h2>
        <span className="num shrink-0 text-mono-petit text-texte-discret">
          {n(kcal)} {t("units.kcal")}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <GramsField value={item.grams} onChange={(g) => onChange({ ...item, grams: g, confirmed: false })} label={t("add.grams")} unit={t("units.g")} />
        <div className="flex flex-wrap justify-end gap-1.5">
          {chips.map((g) => (
            <Chip key={g} selected={item.grams === g} onClick={() => onChange({ ...item, grams: g, confirmed: false })}>
              {n(g)} {t("units.g")}
            </Chip>
          ))}
        </div>
      </div>
      {alert && (
        <p className="mt-2.5 flex items-center justify-between gap-3 text-petit">
          <span className="text-texte-discret">{t("entry.quantity-check")}</span>
          <button className="tap text-actif" onClick={() => onChange({ ...item, confirmed: true })}>
            {t("add.ok")}
          </button>
        </p>
      )}
    </div>
  );
}
