"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BackLink, PageTitle } from "@/components/ui/page";
import { showToast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import { ValueSheet } from "@/components/ui/value-sheet";
import { DISHES } from "@/config/dishes";
import { FoodSearch } from "@/features/add/food-search";
import { Field } from "@/features/create-food/field";
import type { FoodItem } from "@/features/foods/types";
import { useT } from "@/i18n/use-t";
import type { Recipe } from "@/lib/db";
import { dishTotals, draftErrors, type DishDraft, type DraftError, type Ingredient } from "./dish";
import { MacroColumns } from "./macro-columns";
import { deleteDish, saveDish } from "./store";

const toIngredient = (f: FoodItem, grams: number): Ingredient => ({ foodId: f.id, grams, name: f.name, per100g: f.per100g });
const toItem = (i: Ingredient): FoodItem => ({ id: i.foodId, name: i.name ?? i.foodId, per100g: i.per100g ?? { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }, portions: [] });

/**
 * Formulaire « Nouveau plat » (Figma 47:1639), aussi pour modifier un plat. Un seul formulaire :
 * l'interrupteur « Cuisiné en grande quantité » en fait un plat en lot (poids total cuit obligatoire).
 */
export function DishForm({ initial, previous }: { initial: DishDraft; previous?: Recipe }) {
  const { t, n } = useT();
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [step, setStep] = useState<"form" | "search">("form");
  const [editing, setEditing] = useState<number | null>(null);
  const [errors, setErrors] = useState<DraftError[]>([]);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<DishDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const setGrams = (i: number, g: number) =>
    set({ ingredients: draft.ingredients.map((x, j) => (j === i ? { ...x, grams: Math.min(Math.max(g, 0), DISHES.ingredientMaxG) } : x)) });
  const total = dishTotals(draft);
  const title = previous ? t("dishes.edit") : t("dishes.new");
  const g = t("units.g");

  const toggle = (f: FoodItem) =>
    set({
      ingredients: draft.ingredients.some((x) => x.foodId === f.id)
        ? draft.ingredients.filter((x) => x.foodId !== f.id)
        : [...draft.ingredients, toIngredient(f, DISHES.newIngredientG)],
    });

  const save = async () => {
    const errs = draftErrors(draft);
    setErrors(errs);
    if (errs.length) return;
    setSaving(true);
    try {
      const r = await saveDish(draft, previous);
      showToast(t("dishes.saved"));
      router.replace(r.kind === "batch" ? `/recettes/lot/?id=${encodeURIComponent(r.id)}` : "/recettes/");
    } catch {
      showToast(t("dishes.save-error"));
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!previous) return;
    const undo = await deleteDish(previous.id);
    showToast(t("dishes.deleted"), { label: t("dishes.undo"), run: () => void undo() });
    router.replace("/recettes/");
  };

  if (step === "search")
    return (
      <div className="flex flex-col pb-24">
        <button onClick={() => setStep("form")} className="tap self-start text-petit text-actif">
          ‹ {title}
        </button>
        <div className="mt-3.5">
          <FoodSearch selected={draft.ingredients.map(toItem)} onToggle={toggle} />
        </div>
        {/* Comme la saisie : le bouton reste en bas de l'écran pendant qu'on fait défiler les résultats. */}
        <div className="fixed inset-x-0 bottom-0 z-40 bg-fond pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto max-w-md px-[22px]">
            <Button onClick={() => setStep("form")}>{t("dishes.search-done", { n: draft.ingredients.length })}</Button>
          </div>
        </div>
      </div>
    );

  const editingIng = editing === null ? null : draft.ingredients[editing];

  return (
    <div className="flex flex-col">
      <BackLink href="/recettes/">{t("dishes.back-recipes")}</BackLink>
      <PageTitle className="mt-3.5">{title}</PageTitle>
      <Field className="mt-1.5" label={t("dishes.name")} value={draft.name} onChange={(v) => set({ name: v })} placeholder={t("dishes.name-placeholder")} invalid={errors.includes("name")} />

      <p className="num mt-2 flex items-baseline gap-2">
        <span className="text-heros tracking-[-0.04em]">{n(total.kcal)}</span>
        <span className="text-valeur text-texte-discret">{t("units.kcal")}</span>
      </p>
      <div className="mt-2.5">
        <MacroColumns
          items={(["protein", "carbs", "fat", "fiber"] as const).map((k) => ({ label: t(`dishes.${k}`), value: `${n(total[k])} ${g}` }))}
        />
      </div>

      <h2 className="libelle mt-[22px]">{t("dishes.ingredients-raw")}</h2>
      <ul className="mt-1.5">
        {draft.ingredients.map((ing, i) => (
          <li key={ing.foodId} className="flex items-center gap-3 py-3">
            <span className="min-w-0 flex-1 text-petit [overflow-wrap:anywhere]">{ing.name}</span>
            <span className="flex shrink-0 items-center gap-2.5">
              <Stepper sign="−" label={t("dishes.less", { step: DISHES.gramsStep, name: ing.name ?? "" })} onClick={() => setGrams(i, ing.grams - DISHES.gramsStep)} />
              <button onClick={() => setEditing(i)} aria-label={t("dishes.grams-of", { name: ing.name ?? "" })} className="tap num min-w-[4.5ch] text-center text-valeur">
                {n(ing.grams)} {g}
              </button>
              <Stepper sign="+" label={t("dishes.more", { step: DISHES.gramsStep, name: ing.name ?? "" })} onClick={() => setGrams(i, ing.grams + DISHES.gramsStep)} />
            </span>
          </li>
        ))}
      </ul>
      <button onClick={() => setStep("search")} className="tap mt-1 self-start text-petit text-actif underline">
        {t("dishes.add-food")}
      </button>

      <div className="mt-[34px] flex items-center gap-3">
        <span className="min-w-0 flex-1 text-corps">{t("dishes.batch-toggle")}</span>
        <Toggle on={draft.batch} onChange={(v) => set({ batch: v })} label={t("dishes.batch-toggle")} />
      </div>
      <label className="mt-2 flex flex-col gap-1.5 border-b-2 border-actif py-3">
        <span className="libelle">{t("dishes.cooked-weight")}</span>
        <span className="flex items-baseline gap-1.5">
          <input
            inputMode="decimal"
            value={draft.cookedG ?? ""}
            placeholder="–"
            aria-invalid={errors.includes("cooked") || undefined}
            onChange={(e) => {
              const v = parseFloat(e.target.value.replace(",", "."));
              set({ cookedG: Number.isFinite(v) && v > 0 ? Math.min(v, DISHES.cookedMaxG) : null });
            }}
            // Largeur au contenu : l'unité suit le chiffre (« – g », « 1800 g »).
            style={{ width: `${Math.max(String(draft.cookedG ?? "").length, 1) + 0.6}ch` }}
            className="min-w-0 max-w-full bg-transparent text-corps outline-none placeholder:text-texte-discret"
          />
          <span className="text-corps text-texte-discret">{g}</span>
        </span>
      </label>

      {errors.length > 0 && (
        <div className="mt-4">
          {errors.map((e) => (
            <Alert key={e}>{t(`dishes.errors.${e}`)}</Alert>
          ))}
        </div>
      )}

      <Button className="mt-8" onClick={save} disabled={saving}>
        {t("dishes.save")}
      </Button>
      {previous && (
        <button onClick={remove} className="tap mt-4 self-center text-petit text-actif underline">
          {t("dishes.delete")}
        </button>
      )}

      <ValueSheet
        open={editingIng !== null}
        onClose={() => setEditing(null)}
        title={editingIng?.name ?? ""}
        unit={g}
        value={editingIng?.grams ?? 0}
        min={0}
        max={DISHES.ingredientMaxG}
        saveLabel={t("dishes.grams-save")}
        onSave={(v) => editing !== null && setGrams(editing, v)}
      />
    </div>
  );
}

/** Boutons « Moins » et « Plus » du Figma : carré bordé de 26 px, zone de tap de 44 px. */
function Stepper({ sign, label, onClick }: { sign: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="relative flex size-[26px] shrink-0 items-center justify-center rounded-base border border-trait text-petit after:absolute after:left-1/2 after:top-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
    >
      {sign}
    </button>
  );
}
