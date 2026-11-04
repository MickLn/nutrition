import { expect, test } from "vitest";
import type { Food } from "@/lib/db";
import { draftFromFood, EMPTY_DRAFT, kcalFromMacros, kcalMismatch, toNewFood, toNumber, validateDraft, type FoodDraft } from "./form";

const yogurt: FoodDraft = { ...EMPTY_DRAFT, name: " Yaourt grec 0 % ", kcal: "57", protein: "10", carbs: "3,6", fat: "0,4", fiber: "0", portionG: "150", portionLabel: "1 pot" };

test("nombres tapés à la française", () => {
  expect(toNumber("3,6")).toBe(3.6);
  expect(toNumber(" 12 ")).toBe(12);
  expect(toNumber("")).toBeUndefined();
  expect(toNumber("1,2,3")).toBeNaN();
  expect(toNumber("-4")).toBeNaN();
});

test("un aliment complet passe, nom nettoyé", () => {
  const r = validateDraft(yogurt);
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toMatchObject({ name: "Yaourt grec 0 %", carbs: 3.6, sugars: undefined, portionG: 150 });
});

test("champs obligatoires et bornes", () => {
  const r = validateDraft({ ...EMPTY_DRAFT, name: "", kcal: "abc", protein: "120" });
  expect(r.ok).toBe(false);
  if (!r.ok) {
    expect(r.errors).toContainEqual({ field: "name", code: "required" });
    expect(r.errors).toContainEqual({ field: "kcal", code: "number" });
    expect(r.errors).toContainEqual({ field: "protein", code: "max" });
    expect(r.errors).toContainEqual({ field: "carbs", code: "required" });
  }
});

test("la somme des macros ne dépasse pas 100 g, les sucres pas les glucides", () => {
  const r = validateDraft({ ...yogurt, protein: "60", carbs: "50", sugars: "60" });
  expect(r.ok).toBe(false);
  if (!r.ok) {
    expect(r.errors).toContainEqual({ field: "sum", code: "sum" });
    expect(r.errors).toContainEqual({ field: "sugars", code: "sugars" });
  }
});

test("calories et macros : alerte douce seulement au-delà de la tolérance", () => {
  expect(kcalFromMacros({ protein: 10, carbs: 3.6, fat: 0.4, fiber: 0 })).toBeCloseTo(58);
  expect(kcalMismatch(yogurt)).toBeNull();
  expect(kcalMismatch({ ...yogurt, kcal: "120" })).toBeCloseTo(58);
  expect(kcalMismatch({ ...yogurt, kcal: "" })).toBeNull();
});

test("enregistrement : aliment perso, code-barres gardé, portions suivantes conservées", () => {
  const r = validateDraft(yogurt);
  if (!r.ok) throw new Error("invalide");
  expect(toNewFood(r.value, { barcode: "3017620422003", defaultLabel: "1 portion" })).toMatchObject({
    source: "custom",
    barcode: "3017620422003",
    per100g: { kcal: 57, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sugars: null, salt: null },
    portions: [{ label: "1 pot", grams: 150 }],
  });
  const previous: Food = { id: "a", source: "off", name: "Skyr", per100g: { kcal: 60, protein: 11, carbs: 4, fat: 0.2 }, portions: [{ label: "x", grams: 1 }, { label: "1 bol", grams: 200 }], updatedAt: 1 };
  const next = toNewFood({ ...r.value, portionG: undefined }, { id: "a", previous, defaultLabel: "1 portion" });
  expect(next).toMatchObject({ id: "a", source: "off", portions: [{ label: "1 bol", grams: 200 }] });
});

test("le brouillon reprend un aliment enregistré", () => {
  const food: Food = { id: "a", source: "custom", name: "Skyr", brand: "Siggi's", per100g: { kcal: 60, protein: 11, carbs: 4, fat: 0.2, sugars: 4 }, portions: [{ label: "1 pot", grams: 150 }], updatedAt: 1 };
  expect(draftFromFood(food)).toEqual({ ...EMPTY_DRAFT, name: "Skyr", brand: "Siggi's", kcal: "60", protein: "11", carbs: "4", fat: "0,2", sugars: "4", portionG: "150", portionLabel: "1 pot" });
  expect(draftFromFood(food, ".").fat).toBe("0.2");
});
