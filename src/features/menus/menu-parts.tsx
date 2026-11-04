"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Row } from "@/components/ui/row";
import { Sheet } from "@/components/ui/sheet";
import { showToast } from "@/components/ui/toast";
import { ValueSheet } from "@/components/ui/value-sheet";
import { MENUS } from "@/config/menus";
import { FoodSearch } from "@/features/add/food-search";
import type { FoodItem } from "@/features/foods/types";
import { useT } from "@/i18n/use-t";
import type { Core } from "@/lib/nutrition";
import { forGrams } from "@/lib/nutrition";
import { itemKey as keyOf, partsOf, step, type Resolved } from "./menus";
import { useDishes } from "./use-menus";

/** « 3 aliments » : le nombre d'éléments, au singulier ou au pluriel. */
export function useCount() {
  const { t, n } = useT();
  return (count: number, kcal?: number) =>
    t(`menus.${kcal === undefined ? "items" : "items-kcal"}-${count === 1 ? "one" : "other"}`, { n: n(count), kcal: n(kcal ?? 0) });
}

/** Gros chiffre des calories puis protéines, glucides, lipides et fibres (Figma 9:615 et 9:619). */
export function MenuNumbers({ total }: { total: Core }) {
  const { t, n } = useT();
  return (
    <>
      <p className="num mt-2 flex items-baseline gap-2">
        <span className="text-heros tracking-[-0.04em]">{n(total.kcal)}</span>
        <span className="text-valeur text-texte-discret">{t("units.kcal")}</span>
      </p>
      <dl className="mt-2.5 flex gap-3">
        {(["protein", "carbs", "fat", "fiber"] as const).map((k) => (
          <div key={k} className="flex min-w-0 flex-1 flex-col gap-0.5">
            <dt className="text-petit text-texte-discret">{t(`menus.${k}`)}</dt>
            <dd className="num text-moyen whitespace-nowrap">
              {n(total[k])} {t("units.g")}
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}

/** Bouton carré − ou + de 26 px (zone de tap de 44 px). */
function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative flex size-[26px] shrink-0 items-center justify-center rounded-base border border-trait text-petit after:absolute after:-inset-[9px] after:content-['']"
    >
      {children}
    </button>
  );
}

/**
 * Liste « ALIMENTS, POIDS CRU » : un aliment a ses boutons − et + (le chiffre ouvre la saisie exacte),
 * un plat montre ses parts et ses calories (un tap change le nombre de parts). À 0, l'élément est retiré, avec « Annuler ».
 */
export function ItemList({ items, setItems }: { items: Resolved[]; setItems: React.Dispatch<React.SetStateAction<Resolved[]>> }) {
  const { t, n } = useT();
  const [editing, setEditing] = useState<Resolved | null>(null);

  const setGrams = (item: Resolved, grams: number) => {
    if (grams > 0) {
      setItems((xs) => xs.map((x) => (keyOf(x) === keyOf(item) ? { ...x, grams } : x)));
      return;
    }
    const at = items.findIndex((x) => keyOf(x) === keyOf(item));
    setItems((xs) => xs.filter((x) => keyOf(x) !== keyOf(item)));
    showToast(t("menus.removed", { name: item.name }), {
      label: t("menus.undo"),
      run: () => setItems((xs) => (xs.some((x) => keyOf(x) === keyOf(item)) ? xs : [...xs.slice(0, at), item, ...xs.slice(at)])),
    });
  };

  const parts = (i: Resolved) => partsOf(i.grams, i.portionG);
  const partsText = (i: Resolved) => t(`menus.recipe-parts-${parts(i) <= 1 ? "one" : "other"}`, { n: n(parts(i), Number.isInteger(parts(i)) ? 0 : 1) });

  return (
    <>
      <ul>
        {items.map((i) =>
          i.refType === "food" ? (
            <li key={keyOf(i)} className="flex items-center gap-3 py-3">
              <span className="min-w-0 flex-1 text-petit [overflow-wrap:anywhere]">{i.name}</span>
              <span className="flex shrink-0 items-center gap-2.5">
                <StepButton label={t("menus.less", { n: n(MENUS.stepG) })} onClick={() => setGrams(i, step(i.grams, -MENUS.stepG))}>
                  −
                </StepButton>
                <button type="button" onClick={() => setEditing(i)} aria-label={t("menus.grams-of", { name: i.name })} className="tap num text-valeur whitespace-nowrap">
                  {n(i.grams)} {t("units.g")}
                </button>
                <StepButton label={t("menus.more", { n: n(MENUS.stepG) })} onClick={() => setGrams(i, step(i.grams, MENUS.stepG))}>
                  +
                </StepButton>
              </span>
            </li>
          ) : (
            <li key={keyOf(i)}>
              <Row label={i.name} detail={partsText(i)} value={`${n(forGrams(i.per100g, i.grams).kcal)} ${t("units.kcal")}`} onClick={() => setEditing(i)} />
            </li>
          ),
        )}
      </ul>
      <ValueSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? t(editing.refType === "food" ? "menus.grams-of" : "menus.parts-of", { name: editing.name }) : ""}
        unit={editing?.refType === "recipe" ? t("menus.part-unit") : t("units.g")}
        value={editing ? (editing.refType === "recipe" ? parts(editing) : editing.grams) : 0}
        min={0}
        max={editing?.refType === "recipe" ? MENUS.partsMax : MENUS.gramsMax}
        saveLabel={t("menus.ok")}
        onSave={(v) => editing && setGrams(editing, editing.refType === "recipe" ? Math.round(v * (editing.portionG ?? 0)) : v)}
      />
    </>
  );
}

/** Panneau « Ajouter au menu » : recherche d'aliments (cases à cocher) et plats enregistrés. */
export function ItemPicker({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (items: Resolved[]) => void }) {
  const { t } = useT();
  return (
    <Sheet open={open} onClose={onClose} label={t("menus.picker-title")}>
      <PickerBody
        onAdd={(items) => {
          onAdd(items);
          onClose();
        }}
      />
    </Sheet>
  );
}

function PickerBody({ onAdd }: { onAdd: (items: Resolved[]) => void }) {
  const { t, n } = useT();
  const dishes = useDishes() ?? [];
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const count = foods.length + picked.size;

  const toggleFood = (f: FoodItem) => setFoods((xs) => (xs.some((x) => x.id === f.id) ? xs.filter((x) => x.id !== f.id) : [...xs, f]));
  const toggleDish = (id: string) =>
    setPicked((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <div>
      <h2 className="text-section font-medium">{t("menus.picker-title")}</h2>
      <div className="mt-3">
        <FoodSearch selected={foods} onToggle={toggleFood} />
      </div>
      {dishes.length > 0 && (
        <section className="mt-6">
          <h3 className="libelle">{t("menus.dishes")}</h3>
          <ul className="mt-1.5">
            {dishes.map((d) => (
              <li key={d.refId}>
                <Row
                  checked={picked.has(d.refId)}
                  label={d.name}
                  detail={t("menus.dish-detail", { kcal: n(forGrams(d.per100g, d.grams).kcal) })}
                  onClick={() => toggleDish(d.refId)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="sticky bottom-0 -mx-[22px] mt-4 bg-fond px-[22px] pt-3">
        <Button
          disabled={!count}
          onClick={() =>
            onAdd([
              ...foods.map((f): Resolved => ({ refType: "food", refId: f.id, grams: f.lastGrams ?? MENUS.defaultGrams, name: f.name, per100g: f.per100g })),
              ...dishes.filter((d) => picked.has(d.refId)),
            ])
          }
        >
          {t("menus.picker-add", { n: count })}
        </Button>
      </div>
    </div>
  );
}
