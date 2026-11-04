"use client";

import { useEffect, useState } from "react";
import { Chip } from "@/components/ui/chip";
import { FilterGroup } from "@/components/ui/filter";
import { GramsField } from "@/components/ui/grams-field";
import { Row } from "@/components/ui/row";
import { weighCooked } from "@/features/cooked/cooked";
import { MaPesee } from "@/features/cooked/ma-pesee";
import { PAIRS } from "@/features/cooked/pairs";
import { useCooked } from "@/features/cooked/use-cooked";
import type { FoodItem } from "@/features/foods/types";
import { usePortions } from "@/features/journal/use-portions";
import { useT } from "@/i18n/use-t";
import { forGrams } from "@/lib/nutrition";

export type Weighed = {
  food: FoodItem;
  grams: number | null;
  confirmed?: boolean;
  /**
   * Pesé cuit (brique « cooked ») : poids lu sur la balance. `food` porte alors les valeurs pour 100 g cuits
   * et `grams` ce poids, ou null tant qu'aucune conversion n'existe (rien n'est ajouté).
   */
  cooked?: { grams: number | null };
};

type State = "raw" | "cooked";

/** Une ligne par aliment choisi : quantité, raccourci de portion, kcal en direct, alerte neutre, pesé cru ou cuit. */
export function WeighRow({ item, onChange }: { item: Weighed; onChange: (w: Weighed) => void }) {
  const { t, n } = useT();
  const { shortcut, check } = usePortions(item.food.id);
  const c = useCooked(item.food);
  const [weighing, setWeighing] = useState(false);
  const isCooked = !!item.cooked && c.available;
  const kcal = forGrams(item.food.per100g, item.grams ?? 0).kcal;
  const chips = [...new Set([shortcut, ...item.food.portions.map((p) => p.grams)].filter((g): g is number => !!g))];
  const alert = !isCooked && item.grams && !item.confirmed && check(item.grams) === "check";

  const cookedName = t("cooked.entry-name", { name: c.base.name });
  const toCooked = (grams: number | null): Weighed => ({ ...weighCooked(c.base, c.cooked, grams, cookedName), cooked: { grams } });
  const setState = (s: State) => {
    if (s === "cooked") onChange(toCooked(item.grams));
    else onChange({ food: c.base, grams: item.cooked?.grams ?? null });
  };

  // La conversion change (table chargée, « Ma pesée » enregistrée), ou un aliment récent porte des valeurs cuites :
  // on remet à jour ce qui partira dans la saisie.
  const next = !c.available || !c.ready ? null : item.cooked ? toCooked(item.cooked.grams) : { ...item, food: c.base };
  const stale = next && (next.grams !== item.grams || next.food.per100g.kcal !== item.food.per100g.kcal || next.food.name !== item.food.name);
  // Sans liste de dépendances : la comparaison « stale » évite toute boucle.
  useEffect(() => {
    if (stale && next) onChange(next);
  });

  const per100 = c.cooked?.per100g.kcal;
  const source = !c.cooked
    ? t("cooked.no-source")
    : c.cooked.source === "ciqual-cooked"
      ? t("cooked.detail-ciqual", { source: PAIRS.label, name: c.cookedName ?? "" })
      : t("cooked.detail-weighing", { y: n(c.cooked.yield ?? 0, 2) });

  return (
    <div className="pb-3.5 pt-3.5 first:pt-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="min-w-0 flex-1 text-petit [overflow-wrap:anywhere]">{c.available ? c.base.name : item.food.name}</h2>
        <span className="num shrink-0 text-mono-petit text-texte-discret">
          {n(kcal)} {t("units.kcal")}
        </span>
      </div>
      {c.available && (
        <div className="mt-2">
          <FilterGroup<State>
            label={t("cooked.state")}
            value={isCooked ? "cooked" : "raw"}
            onChange={setState}
            options={[
              { value: "raw", label: t("cooked.weighed-raw") },
              { value: "cooked", label: t("cooked.weighed-cooked") },
            ]}
          />
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        {isCooked ? (
          <GramsField value={item.cooked!.grams} onChange={(g) => onChange(toCooked(g))} label={t("cooked.cooked-grams")} unit={t("units.g")} />
        ) : (
          <GramsField value={item.grams} onChange={(g) => onChange({ ...item, grams: g, confirmed: false })} label={t("add.grams")} unit={t("units.g")} />
        )}
        {!isCooked && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {chips.map((g) => (
              <Chip key={g} selected={item.grams === g} onClick={() => onChange({ ...item, grams: g, confirmed: false })}>
                {n(g)} {t("units.g")}
              </Chip>
            ))}
          </div>
        )}
      </div>
      {isCooked && (
        <Row
          className="mt-1"
          label={t("cooked.per-100-cooked")}
          detail={`${source} ›`}
          value={per100 !== undefined ? `${n(per100)} ${t("units.kcal")}` : t("cooked.none")}
          onClick={() => setWeighing(true)}
        />
      )}
      {alert && (
        <p className="mt-2.5 flex items-center justify-between gap-3 text-petit">
          <span className="text-texte-discret">{t("entry.quantity-check")}</span>
          <button className="tap text-actif" onClick={() => onChange({ ...item, confirmed: true })}>
            {t("add.ok")}
          </button>
        </p>
      )}
      {c.available && <MaPesee open={weighing} onClose={() => setWeighing(false)} food={c.base} currentYield={c.cooked?.yield} />}
    </div>
  );
}
