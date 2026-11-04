import { expect, test } from "vitest";
import { FOOD } from "@/config/food";
import type { FoodItem } from "@/features/foods/types";
import { macroDistance, similarFoods } from "./vary";

const f = (id: string, name: string, kcal: number, protein: number, carbs: number, fat: number, fiber: number): FoodItem => ({
  id,
  name,
  per100g: { kcal, protein, carbs, fat, fiber },
  portions: [],
});

const oats = f("ciqual:32140", "Oat flakes", 369, 10.6, 57.7, 7.82, 11.2);
const catalog = [
  oats,
  f("ciqual:9310", "Oat, raw", 378, 16.9, 55.7, 6.9, 10.6),
  f("ciqual:9340", "Quinoa, raw", 358, 13.2, 58.1, 6.07, 7.0),
  f("ciqual:9341", "Quinoa, boiled/cooked in water", 149, 4.66, 27.9, 1.1, 3.8),
  f("ciqual:11006", "Ginger, powder", 335, 8.98, 58.3, 4.24, 14.1),
  f("ciqual:32141", "Oat flakes, organic", 360, 11, 57, 7, 11),
  f("ciqual:9999", "Mix of cereals, raw", 380, 9, 58, 7.5, 11),
  f("ciqual:24655", "Biscuit, oat, plain", 491, 5.64, 63.9, 22.9, 3.41),
  f("ciqual:9000", "Amaranth, raw", 369, 13.5, 58.6, 7.02, 6.7),
];

test("distance en grammes sur les quatre macros", () => {
  expect(macroDistance(oats.per100g, oats.per100g)).toBe(0);
  expect(macroDistance({ kcal: 0, protein: 3, carbs: 4, fat: 0, fiber: 0 }, { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })).toBe(5);
});

test("aliments proches plus protéinés ou moins caloriques, même famille d'abord", () => {
  const ids = similarFoods(oats, catalog).map((x) => x.id);
  // « Oat, raw » partage le mot « oat » : il passe devant quinoa et amarante.
  expect(ids).toEqual(["ciqual:9310", "ciqual:9340", "ciqual:9000"]);
});

test("écarte la variante du même aliment, les épices, les calories trop éloignées et les aliments ni meilleurs ni proches", () => {
  const ids = similarFoods(oats, catalog, { ...FOOD.vary, count: 10 }).map((x) => x.id);
  expect(ids).not.toContain("ciqual:32141"); // « Oat flakes, organic » : même aliment
  expect(ids).not.toContain("ciqual:11006"); // épice
  expect(ids).not.toContain("ciqual:9341"); // cuit : calories trop loin
  expect(ids).not.toContain("ciqual:24655"); // biscuit : trop calorique
  expect(ids).not.toContain("ciqual:9999"); // plus calorique et moins protéiné
});

test("sans calories connues, rien à proposer", () => {
  expect(similarFoods(f("x", "Inconnu", 0, 0, 0, 0, 0), catalog)).toEqual([]);
});
