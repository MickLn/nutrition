"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page";
import { showToast } from "@/components/ui/toast";
import { FOOD } from "@/config/food";
import { BackButton } from "@/features/food-sheet/back-button";
import { saveFood } from "@/features/foods/store";
import { useT } from "@/i18n/use-t";
import type { Food } from "@/lib/db";
import { Field } from "./field";
import { kcalMismatch, NUMBER_FIELDS, OPTIONAL_FIELDS, toNewFood, validateDraft, type DraftKey, type FoodDraft, type FormError } from "./form";

const MAX: Partial<Record<DraftKey, number>> = {
  kcal: FOOD.kcalMax,
  protein: FOOD.gramsMax,
  carbs: FOOD.gramsMax,
  fat: FOOD.gramsMax,
  fiber: FOOD.gramsMax,
  sugars: FOOD.gramsMax,
  salt: FOOD.gramsMax,
  portionG: FOOD.portionMaxG,
};

/**
 * Formulaire « Nouvel aliment » (Figma 8:502), aussi utilisé pour modifier un aliment perso.
 * Les erreurs bloquantes s'affichent à l'enregistrement ; l'écart calories / macros est une alerte douce.
 */
export function FoodForm({
  initial,
  previous,
  barcode,
  onSaved,
  onCancel,
}: {
  initial: FoodDraft;
  /** Aliment modifié (absent à la création). */
  previous?: Food;
  barcode?: string;
  onSaved: (f: Food) => void;
  onCancel: () => void;
}) {
  const { t, n } = useT();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [saving, setSaving] = useState(false);
  const set = (k: DraftKey) => (v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const label = (k: DraftKey) => t(`create-food.${k}`);
  const invalid = (k: DraftKey) => errors.some((e) => e.field === k);
  const expected = kcalMismatch(draft);
  const edit = !!previous;

  const save = async () => {
    const r = validateDraft(draft);
    if (!r.ok) {
      setErrors(r.errors);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      const food = await saveFood(toNewFood(r.value, { id: previous?.id, previous, barcode, defaultLabel: t("create-food.portion-default") }));
      showToast(t("create-food.saved"));
      onSaved(food);
    } catch {
      showToast(t("create-food.save-error"));
      setSaving(false);
    }
  };

  const message = (e: FormError) => {
    if (e.field === "sum" || e.code === "sum" || e.code === "sugars") return t(`create-food.errors.${e.code}`);
    const field = label(e.field).split(",")[0];
    return t(`create-food.errors.${e.code}`, { field, max: n(MAX[e.field] ?? FOOD.nameMaxLength) });
  };

  return (
    <form
      className="flex flex-col pb-40"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <BackButton fallback="/ajouter/">{t(edit ? "create-food.back-edit" : "create-food.back")}</BackButton>
      <PageTitle className="mt-3.5">{t(edit ? "create-food.title-edit" : "create-food.title")}</PageTitle>

      <Field className="mt-1.5" label={label("name")} value={draft.name} onChange={set("name")} placeholder={t("create-food.name-placeholder")} invalid={invalid("name")} />
      <Field label={label("brand")} value={draft.brand} onChange={set("brand")} placeholder={t("create-food.brand-placeholder")} invalid={invalid("brand")} />

      <h2 className="libelle mt-[22px]">{t("create-food.per-100")}</h2>
      <div className="mt-1.5 grid grid-cols-2 gap-x-[18px]">
        {NUMBER_FIELDS.map((k) => (
          <Field
            key={k}
            number
            label={label(k)}
            value={draft[k]}
            onChange={set(k)}
            placeholder={OPTIONAL_FIELDS.includes(k) ? t("create-food.optional") : undefined}
            invalid={invalid(k) || (k !== "portionG" && k !== "sugars" && k !== "salt" && errors.some((e) => e.field === "sum"))}
          />
        ))}
      </div>
      {draft.portionG.trim() && (
        <Field label={label("portionLabel")} value={draft.portionLabel} onChange={set("portionLabel")} placeholder={t("create-food.portion-placeholder")} invalid={invalid("portionLabel")} />
      )}

      {(errors.length > 0 || expected !== null) && (
        <div className="mt-4" role="status">
          {errors.map((e) => (
            <Alert key={e.field}>{message(e)}</Alert>
          ))}
          {expected !== null && <Alert>{t("create-food.kcal-check", { n: n(expected) })}</Alert>}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 bg-fond pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto flex max-w-md flex-col gap-2.5 px-[22px]">
          <Button type="submit" disabled={saving}>
            {t(edit ? "create-food.save-edit" : "create-food.save")}
          </Button>
          <Button type="button" variant="link" className="tap w-full"onClick={onCancel}>
            {t("create-food.cancel")}
          </Button>
        </div>
      </div>
    </form>
  );
}
