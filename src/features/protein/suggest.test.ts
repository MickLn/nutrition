import { expect, test } from "vitest";
import type { FoodItem } from "@/features/foods/types";
import { isLate, portionFor, suggestFoods } from "./suggest";

const f = (name: string, protein: number, kcal: number, lastGrams?: number): FoodItem => ({
  id: name,
  name,
  per100g: { kcal, protein, carbs: 0, fat: 0, fiber: 0 },
  portions: [],
  lastGrams,
});
const poulet = f("Poulet", 31, 165, 140);
const skyr = f("Skyr", 11, 63, 150);
const pain = f("Pain", 6, 270);

test("tard le soir à partir de l'heure réglée", () => {
  expect(isLate("20:59")).toBe(false);
  expect(isLate("21:00")).toBe(true);
});

test("la quantité comble l'écart, limitée à la dernière quantité", () => {
  expect(portionFor(poulet, 20)?.grams).toBe(60);
  const big = portionFor(poulet, 77)!;
  expect(big.grams).toBe(140);
  expect(Math.round(big.protein)).toBe(43);
  expect(portionFor(skyr, 0)).toBeNull();
});

test("le jour : celui qui comble le plus d'abord", () => {
  expect(suggestFoods(77, [skyr, poulet], [], false).map((s) => s.food.name)).toEqual(["Poulet", "Skyr"]);
});

test("tard le soir : seulement du léger", () => {
  expect(suggestFoods(31, [poulet, skyr], [], true).map((s) => s.food.name)).toEqual(["Skyr"]);
});

test("aliments trop pauvres écartés, catalogue seulement pour compléter", () => {
  expect(suggestFoods(30, [pain], [], false)).toEqual([]);
  const cat = [f("Thon", 25, 116), f("Poudre", 80, 380), f("Huile", 0, 900)];
  expect(suggestFoods(30, [pain], cat, false).map((s) => s.food.name)).toEqual(["Thon"]);
  const own = [poulet, skyr, f("Œufs", 13, 140)];
  expect(suggestFoods(30, own, cat, false).map((s) => s.food.name)).not.toContain("Thon");
});
