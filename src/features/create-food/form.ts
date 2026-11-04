import { z } from "zod";
import { FOOD } from "@/config/food";
import { RULES } from "@/config/rules";
import type { NewFood } from "@/features/foods/store";
import type { Food, Macros } from "@/lib/db";

/** Brouillon du formulaire « Nouvel aliment » : le texte tel qu'il est tapé (« 3,6 »). */
export type FoodDraft = {
  name: string;
  brand: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugars: string;
  salt: string;
  portionG: string;
  portionLabel: string;
};

export type DraftKey = keyof FoodDraft;
/** Champs chiffrés, dans l'ordre de la grille « Pour 100 g ». */
export const NUMBER_FIELDS = ["kcal", "protein", "carbs", "fat", "fiber", "sugars", "salt", "portionG"] as const;
export type NumberField = (typeof NUMBER_FIELDS)[number];
/** Champs chiffrés facultatifs (valeur discrète tant qu'ils sont vides). */
export const OPTIONAL_FIELDS: readonly DraftKey[] = ["brand", "sugars", "salt", "portionG", "portionLabel"];

export const EMPTY_DRAFT: FoodDraft = { name: "", brand: "", kcal: "", protein: "", carbs: "", fat: "", fiber: "", sugars: "", salt: "", portionG: "", portionLabel: "" };

/** « 3,6 » → 3.6 ; texte vide → undefined ; texte invalide → NaN (refusé par le schéma). */
export function toNumber(s: string): number | undefined {
  const v = s.trim().replace(",", ".");
  if (!v) return undefined;
  return /^\d*\.?\d+$|^\d+\.$/.test(v) ? Number(v) : NaN;
}

const required = (max: number) =>
  z
    .string()
    .transform(toNumber)
    .pipe(z.number({ error: (i) => (i.input === undefined ? "required" : "number") }).min(0, "number").max(max, "max"));
const optional = (max: number) => z.string().transform(toNumber).pipe(z.number({ error: "number" }).min(0, "number").max(max, "max").optional());

/** Validation du formulaire (bornes dans config/food.ts). Les messages sont des codes, traduits par la page. */
export const foodFormSchema = z
  .object({
    name: z.string().trim().min(1, "required").max(FOOD.nameMaxLength, "too-long"),
    brand: z.string().trim().max(FOOD.brandMaxLength, "too-long"),
    kcal: required(FOOD.kcalMax),
    protein: required(FOOD.gramsMax),
    carbs: required(FOOD.gramsMax),
    fat: required(FOOD.gramsMax),
    fiber: required(FOOD.gramsMax),
    sugars: optional(FOOD.gramsMax),
    salt: optional(FOOD.gramsMax),
    portionG: optional(FOOD.portionMaxG),
    portionLabel: z.string().trim().max(FOOD.nameMaxLength, "too-long"),
  })
  .superRefine((v, ctx) => {
    if (v.protein + v.carbs + v.fat + v.fiber > FOOD.macroSumMaxG) ctx.addIssue({ code: "custom", path: ["sum"], message: "sum" });
    if (v.sugars !== undefined && v.sugars > v.carbs) ctx.addIssue({ code: "custom", path: ["sugars"], message: "sugars" });
    if (v.portionG === 0) ctx.addIssue({ code: "custom", path: ["portionG"], message: "number" });
  });

export type FoodForm = z.infer<typeof foodFormSchema>;
/** Erreur bloquante : le champ concerné (ou « sum ») et un code de message. */
export type FormError = { field: DraftKey | "sum"; code: "required" | "number" | "max" | "too-long" | "sum" | "sugars" };

export function validateDraft(d: FoodDraft): { ok: true; value: FoodForm } | { ok: false; errors: FormError[] } {
  const r = foodFormSchema.safeParse(d);
  if (r.success) return { ok: true, value: r.data };
  const seen = new Set<string>();
  const errors: FormError[] = [];
  for (const issue of r.error.issues) {
    const field = String(issue.path[0]) as FormError["field"];
    if (seen.has(field)) continue;
    seen.add(field);
    errors.push({ field, code: issue.message as FormError["code"] });
  }
  return { ok: false, errors };
}

/** Calories attendues d'après les macros (4 / 4 / 9 kcal par g, 2 pour les fibres). */
export function kcalFromMacros(m: Pick<Macros, "protein" | "carbs" | "fat"> & { fiber?: number | null }): number {
  const k = RULES.kcalPerG.value;
  return m.protein * k.protein + m.carbs * k.carbs + m.fat * k.fat + (m.fiber ?? 0) * FOOD.fiberKcalPerG;
}

/**
 * Alerte douce : les calories saisies s'éloignent de celles des macros. Renvoie les kcal attendues, ou null si c'est cohérent
 * (ou si les champs ne sont pas encore remplis). Ne bloque jamais l'enregistrement.
 */
export function kcalMismatch(d: FoodDraft): number | null {
  const [kcal, protein, carbs, fat] = [d.kcal, d.protein, d.carbs, d.fat].map(toNumber);
  if ([kcal, protein, carbs, fat].some((v) => v === undefined || Number.isNaN(v))) return null;
  const fiber = toNumber(d.fiber);
  const expected = kcalFromMacros({ protein: protein!, carbs: carbs!, fat: fat!, fiber: Number.isNaN(fiber) ? 0 : fiber });
  const gap = Math.abs(kcal! - expected);
  return gap > FOOD.kcalTolerance.kcal && gap > FOOD.kcalTolerance.pct * Math.max(kcal!, expected) ? expected : null;
}

/** Brouillon pré-rempli depuis un aliment enregistré (modification), avec le séparateur décimal de la langue. */
export function draftFromFood(f: Food, decimal = ","): FoodDraft {
  const s = (v: number | null | undefined) => (v === undefined || v === null ? "" : String(v).replace(".", decimal));
  const first = f.portions[0];
  return {
    name: f.name,
    brand: f.brand ?? "",
    kcal: s(f.per100g.kcal),
    protein: s(f.per100g.protein),
    carbs: s(f.per100g.carbs),
    fat: s(f.per100g.fat),
    fiber: s(f.per100g.fiber),
    sugars: s(f.per100g.sugars),
    salt: s(f.per100g.salt),
    portionG: s(first?.grams),
    portionLabel: first?.label ?? "",
  };
}

/**
 * Aliment à enregistrer (`saveFood`). Le formulaire modifie la première portion ; les suivantes d'un aliment
 * existant sont gardées. Sans nom de portion, `defaultLabel` est utilisé (« 1 portion »).
 */
export function toNewFood(v: FoodForm, opts: { id?: string; barcode?: string; previous?: Food; defaultLabel: string }): NewFood {
  const portion = v.portionG ? [{ label: v.portionLabel || opts.defaultLabel, grams: v.portionG }] : [];
  const per100g: Macros = { kcal: v.kcal, protein: v.protein, carbs: v.carbs, fat: v.fat, fiber: v.fiber, sugars: v.sugars ?? null, salt: v.salt ?? null };
  const food: NewFood = {
    ...(opts.previous ?? {}),
    id: opts.id,
    source: opts.previous?.source ?? "custom",
    name: v.name,
    brand: v.brand || undefined,
    per100g,
    portions: [...portion, ...(opts.previous?.portions.slice(1) ?? [])],
  };
  const barcode = opts.barcode ?? opts.previous?.barcode;
  if (barcode) food.barcode = barcode;
  return food;
}
