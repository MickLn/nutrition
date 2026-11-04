import { expect, test } from "vitest";
import { cookedMacros, resolveCooked, yieldFrom } from "./cooked";

const pastaRaw = { kcal: 364, protein: 12.5, carbs: 72, fat: 1.5, fiber: 3 };
const pastaCiqual = { kcal: 155, protein: 5.3, carbs: 30.6, fat: 0.7, fiber: 1.6 };

test("pesée perso : 319 g de pâtes cuites à ×2,20 = 145 g crues = 528 kcal", () => {
  const c = resolveCooked({ rawPer100g: pastaRaw, baseYield: yieldFrom(145, 319), ciqualCookedPer100g: pastaCiqual })!;
  expect(c.source).toBe("base-weighing");
  expect(Math.round(cookedMacros(c.per100g, 319).kcal)).toBe(528);
});
test("la pesée du produit passe avant celle de l'aliment de base", () => {
  expect(resolveCooked({ rawPer100g: pastaRaw, productYield: 2.5, baseYield: 2.2 })!.source).toBe("product-weighing");
});
test("sans pesée : valeur cuite CIQUAL", () => {
  expect(resolveCooked({ rawPer100g: pastaRaw, ciqualCookedPer100g: pastaCiqual })).toEqual({ per100g: pastaCiqual, source: "ciqual-cooked" });
});
test("ni pesée ni paire validée : aucune conversion", () => {
  expect(resolveCooked({ rawPer100g: pastaRaw })).toBeNull();
});
test("320 g de lasagnes à 134 kcal/100 g : 429 kcal", () => {
  expect(Math.round(cookedMacros({ kcal: 134, protein: 7, carbs: 12, fat: 6, fiber: 1 }, 320).kcal)).toBe(429);
});
test("pesée invalide : erreur explicite", () => expect(() => yieldFrom(0, 300)).toThrow("cooked.weighing-invalid"));
