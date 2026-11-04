import { expect, test } from "vitest";
import { batchTotals, portionMacros, remainingAfter } from "./math";

const rice = { kcal: 350, protein: 7, carbs: 77, fat: 1, fiber: 1 };
const chicken = { kcal: 110, protein: 23, carbs: 0, fat: 2, fiber: 0 };

test("un plat de 1 200 g cuit, portion de 300 g : un quart des macros", () => {
  const total = batchTotals([{ per100g: rice, grams: 400 }, { per100g: chicken, grams: 600 }]);
  expect(total.kcal).toBe(2060);
  expect(portionMacros(total, 1200, 300).kcal).toBe(515);
});
test("poids cuit à 0 : erreur explicite", () => {
  expect(() => portionMacros(batchTotals([]), 0, 300)).toThrow("batch.cooked-weight-missing");
});
test("reste du plat", () => {
  expect(remainingAfter(1200, [300, 400])).toBe(500);
  expect(remainingAfter(500, [600])).toBe(0);
});
