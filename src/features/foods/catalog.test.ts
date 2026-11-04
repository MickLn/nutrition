import { expect, test } from "vitest";
import { buildIndex } from "./catalog";
import type { FoodItem } from "./types";

const f = (id: string, name: string): FoodItem => ({ id, name, per100g: { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }, portions: [] });

test("recherche sans accents, par début de mot, aliments perso devant", () => {
  const search = buildIndex([f("ciqual:1", "Pâtes sèches, cuites"), f("ciqual:2", "Riz basmati, cuit"), f("perso", "Pâtes protéinées")]);
  expect(search("pate", 10).map((x) => x.id)).toEqual(["perso", "ciqual:1"]);
  expect(search("riz cui", 10).map((x) => x.id)).toEqual(["ciqual:2"]);
});
