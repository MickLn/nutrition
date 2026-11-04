import "fake-indexeddb/auto";
import { beforeEach, expect, test } from "vitest";
import { db, type Food, type LogEntry } from "@/lib/db";
import { countProducts, groupByLetter, listProducts, productPortion, sectionLetter, sortProducts } from "./products";

const food = (id: string, name: string, extra: Partial<Food> = {}): Food => ({
  id,
  source: "custom",
  name,
  per100g: { kcal: 100, protein: 10, carbs: 10, fat: 1 },
  portions: [],
  updatedAt: 1,
  ...extra,
});

const entry = (refId: string, updatedAt: number): LogEntry => ({
  id: `${refId}-${updatedAt}`,
  date: "2026-11-01",
  time: "12:00",
  meal: "lunch",
  refType: "food",
  refId,
  name: refId,
  grams: 100,
  snapshot: { kcal: 100, protein: 10, carbs: 10, fat: 1, fiber: 0 },
  updatedAt,
});

beforeEach(async () => {
  await db.foods.clear();
  await db.logEntries.clear();
});

test("A à Z suit l'ordre de la langue, accents et majuscules compris", () => {
  const list = [food("1", "banane"), food("2", "Écrasé de pommes"), food("3", "avocat"), food("4", "Amandes")];
  expect(sortProducts(list, { sort: "az" }).map((f) => f.name)).toEqual(["Amandes", "avocat", "banane", "Écrasé de pommes"]);
});

test("la recherche ignore les accents et demande tous les mots, marque comprise", () => {
  const list = [food("1", "Pâtes protéinées", { brand: "Barilla" }), food("2", "Pâté de campagne"), food("3", "Riz")];
  expect(sortProducts(list, { sort: "az", query: "pate" }).map((f) => f.id)).toEqual(["2", "1"]);
  expect(sortProducts(list, { sort: "az", query: "pates barilla" }).map((f) => f.id)).toEqual(["1"]);
});

test("Favoris garde seulement les produits étiquetés", () => {
  const list = [food("1", "Skyr", { tags: ["favori"] }), food("2", "Riz")];
  expect(sortProducts(list, { sort: "fav" }).map((f) => f.id)).toEqual(["1"]);
});

test("Récents : dernier repas noté, sinon date d'ajout", () => {
  const list = [food("old", "A", { updatedAt: 10 }), food("eaten", "B", { updatedAt: 5 }), food("new", "C", { updatedAt: 20 })];
  const lastUsed = new Map([["eaten", 30]]);
  expect(sortProducts(list, { sort: "recent", lastUsed }).map((f) => f.id)).toEqual(["eaten", "new", "old"]);
});

test("lettres de section", () => {
  expect(sectionLetter("Écrasé")).toBe("E");
  expect(sectionLetter("Œuf")).toBe("O");
  expect(sectionLetter("7 Up")).toBe("#");
  const groups = groupByLetter([food("1", "Amandes"), food("2", "Avocat"), food("3", "Banane")]);
  expect(groups.map((g) => [g.letter, g.foods.length])).toEqual([
    ["A", 2],
    ["B", 1],
  ]);
});

test("quantité affichée : première portion, sinon 100 g", () => {
  expect(productPortion(food("1", "Amandes", { per100g: { kcal: 600, protein: 21, carbs: 7, fat: 52 }, portions: [{ label: "1 poignée", grams: 30 }] }))).toEqual({ grams: 30, kcal: 180 });
  expect(productPortion(food("2", "Avocat", { per100g: { kcal: 160, protein: 2, carbs: 2, fat: 15 } }))).toEqual({ grams: 100, kcal: 160 });
});

test("listProducts lit les produits scannés et perso, sans CIQUAL", async () => {
  await db.foods.bulkPut([food("a", "Skyr", { source: "off", updatedAt: 1 }), food("b", "Amandes", { updatedAt: 2 }), food("c", "Pomme", { source: "ciqual" })]);
  await db.logEntries.put(entry("a", 50));
  expect((await listProducts({ sort: "az" })).map((f) => f.id)).toEqual(["b", "a"]);
  expect((await listProducts({ sort: "recent" })).map((f) => f.id)).toEqual(["a", "b"]);
  expect(await countProducts()).toBe(2);
});
