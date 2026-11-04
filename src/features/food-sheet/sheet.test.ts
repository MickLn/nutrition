import { expect, test } from "vitest";
import { gramsParam, initialGrams, quantityChips } from "./sheet";

test("puces : saisie, portion habituelle et 100 g triées, puis portions nommées", () => {
  expect(quantityChips({ entryGrams: 60, usual: 30, portions: [{ label: "1 bol", grams: 50 }] })).toEqual([
    { grams: 30 },
    { grams: 60 },
    { grams: 100 },
    { grams: 50, label: "1 bol" },
  ]);
});

test("puces sans doublon ni valeur vide", () => {
  expect(quantityChips({ entryGrams: 100, usual: null, portions: [{ label: " ", grams: 20 }] })).toEqual([{ grams: 100 }]);
});

test("quantité de départ", () => {
  expect(initialGrams({ entryGrams: 60, usual: 55, portions: [] })).toBe(60);
  expect(initialGrams({ usual: 55, portions: [] })).toBe(55);
  expect(initialGrams({ portions: [{ label: "1 pot", grams: 125 }] })).toBe(125);
  expect(initialGrams({ portions: [] })).toBe(100);
});

test("grammes lus dans l'URL", () => {
  expect(gramsParam("60")).toBe(60);
  expect(gramsParam("abc")).toBeNull();
  expect(gramsParam("0")).toBeNull();
  expect(gramsParam(null)).toBeNull();
});
