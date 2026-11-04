import { describe, expect, it } from "vitest";
import type { Recipe } from "@/lib/db";
import {
  afterPart,
  declareRemaining,
  discardRest,
  dishTotals,
  draftErrors,
  draftToRecipe,
  filterDishes,
  inProgress,
  partMacros,
  partsLeft,
  remainingOf,
  sameFoods,
  typicalPart,
  whenLabel,
} from "./dish";

const pasta = { foodId: "a", name: "Pâtes protéinées", grams: 400, per100g: { kcal: 350, protein: 20, carbs: 55, fat: 2, fiber: 6 } };
const beef = { foodId: "b", name: "Bœuf haché 5 %", grams: 500, per100g: { kcal: 125, protein: 21, carbs: 0, fat: 5, fiber: 0 } };
const tomato = { foodId: "c", name: "Coulis de tomate", grams: 900, per100g: { kcal: 30, protein: 1.5, carbs: 5, fat: 0.2, fiber: 1.5 } };

const batch = (over: Partial<Recipe> = {}): Recipe => ({
  id: "bolo",
  name: "Bolognaise maison",
  kind: "batch",
  ingredients: [pasta, beef, tomato],
  cookedWeightG: 1800,
  remainingG: 1100,
  servings: 5,
  updatedAt: 0,
  ...over,
});

describe("calcul d'une part", () => {
  it("total du plat à partir des ingrédients crus", () => {
    expect(dishTotals(batch()).kcal).toBe(1400 + 625 + 270);
  });
  it("part = poids de la part ÷ poids cuit total", () => {
    const m = partMacros(batch(), 360);
    expect(m.kcal).toBeCloseTo((2295 * 360) / 1800);
    expect(m.protein).toBeCloseTo(((80 + 105 + 13.5) * 360) / 1800);
  });
  it("sans poids cuit : on rapporte au poids cru des ingrédients", () => {
    expect(partMacros(batch({ cookedWeightG: undefined }), 1800).kcal).toBeCloseTo(2295);
  });
  it("plat sans ingrédient : zéro, pas d'erreur", () => {
    expect(partMacros(batch({ ingredients: [], cookedWeightG: undefined }), 300).kcal).toBe(0);
  });
});

describe("reste et plat terminé", () => {
  it("une part fait baisser le reste", () => {
    expect(afterPart(batch(), 350, 9)).toEqual({ remainingG: 750, finishedAt: undefined, updatedAt: 9 });
  });
  it("à 0 g le plat se ferme sans question", () => {
    expect(afterPart(batch(), 1200, 9)).toMatchObject({ remainingG: 0, finishedAt: 9 });
  });
  it("une part d'un plat classique ne touche pas de reste", () => {
    expect(afterPart(batch({ kind: "recipe" }), 300, 9)).toEqual({ updatedAt: 9 });
  });
  it("« il reste X g » corrige le reste sans rien compter, borné au poids cuit", () => {
    expect(declareRemaining(batch(), 600, 9)).toMatchObject({ remainingG: 600, finishedAt: undefined });
    expect(declareRemaining(batch(), 5000, 9).remainingG).toBe(1800);
    expect(declareRemaining(batch(), 0, 9)).toMatchObject({ remainingG: 0, finishedAt: 9 });
  });
  it("« jeter le reste » termine le plat", () => {
    expect(discardRest(9)).toEqual({ remainingG: 0, finishedAt: 9, updatedAt: 9 });
  });
  it("un plat terminé ne reste plus à finir", () => {
    expect(inProgress(batch())).toBe(true);
    expect(inProgress(batch({ finishedAt: 1 }))).toBe(false);
    expect(remainingOf(batch({ finishedAt: 1 }))).toBe(0);
    expect(remainingOf(batch({ kind: "recipe" }))).toBeNull();
  });
});

describe("environ N parts", () => {
  it("d'après la moyenne des parts mangées", () => {
    expect(typicalPart([350, 350])).toBe(350);
    expect(partsLeft(1100, typicalPart([350, 350]))).toEqual({ key: "parts-many", n: 3 });
    expect(partsLeft(750, 350)).toEqual({ key: "parts-many", n: 2 });
    expect(partsLeft(400, 350)).toEqual({ key: "parts-one", n: 1 });
    expect(partsLeft(100, 350)).toEqual({ key: "parts-less", n: 0 });
    expect(partsLeft(0, 350)).toBeNull();
  });
  it("sans part mangée : part par défaut", () => expect(typicalPart([])).toBe(350));
});

describe("enregistrer le plat", () => {
  const draft = { name: " Bolognaise maison ", ingredients: [pasta, { ...beef, grams: 0 }], batch: true, cookedG: 1800 };
  it("signale ce qui manque", () => {
    expect(draftErrors({ name: "", ingredients: [], batch: true, cookedG: null })).toEqual(["name", "ingredients", "cooked"]);
    expect(draftErrors(draft)).toEqual([]);
    expect(draftErrors({ ...draft, batch: false, cookedG: null })).toEqual([]);
  });
  it("nouveau plat en lot : tout le poids cuit reste, ingrédients à 0 g retirés", () => {
    const r = draftToRecipe(draft, "x", undefined, 5);
    expect(r).toMatchObject({ name: "Bolognaise maison", kind: "batch", remainingG: 1800, cookedAt: 5, servings: 5 });
    expect(r.ingredients).toHaveLength(1);
  });
  it("modifier le poids cuit d'un plat en cours décale le reste", () => {
    expect(draftToRecipe({ ...draft, cookedG: 1900 }, "bolo", batch(), 5).remainingG).toBe(1200);
    expect(draftToRecipe({ ...draft, cookedG: 500 }, "bolo", batch(), 5).remainingG).toBe(0);
  });
  it("un plat terminé le reste après modification", () => {
    expect(draftToRecipe(draft, "bolo", batch({ finishedAt: 3, remainingG: 0 }), 5)).toMatchObject({ finishedAt: 3, remainingG: 0 });
  });
  it("plat classique : pas de reste", () => {
    const r = draftToRecipe({ ...draft, batch: false }, "x", batch(), 5);
    expect(r.kind).toBe("recipe");
    expect(r.remainingG).toBeUndefined();
    expect(r.cookedWeightG).toBe(1800);
  });
});

it("mêmes aliments, dans n'importe quel ordre", () => {
  expect(sameFoods(batch(), ["c", "a", "b"])).toBe(true);
  expect(sameFoods(batch(), ["a", "b"])).toBe(false);
});

it("filtre sans accents et trie", () => {
  const list = [batch({ id: "1", name: "Pâtes poulet", updatedAt: 1 }), batch({ id: "2", name: "Dal de lentilles", updatedAt: 2 })];
  expect(filterDishes(list, "pate").map((r) => r.id)).toEqual(["1"]);
  expect(filterDishes(list).map((r) => r.id)).toEqual(["2", "1"]);
  expect(filterDishes(list, "", "az").map((r) => r.id)).toEqual(["2", "1"]);
  expect(filterDishes(list, "poulet pâte").map((r) => r.id)).toEqual(["1"]);
  expect(filterDishes([...list, batch({ id: "3", name: "Chili", favorite: true })], "", "fav").map((r) => r.id)).toEqual(["3"]);
});

it("le jour s'il est récent, sinon la date", () => {
  const today = new Date(2026, 10, 4);
  expect(whenLabel(new Date(2026, 10, 1, 20), today, "fr-FR")).toEqual({ kind: "weekday", text: "dimanche" });
  expect(whenLabel(new Date(2026, 9, 20), today, "fr-FR").kind).toBe("date");
});
