import "fake-indexeddb/auto";
import { beforeEach, expect, test } from "vitest";
import { cookedMacros } from "@/bricks/cooked/cooked";
import { saveFood } from "@/features/foods/store";
import type { FoodItem } from "@/features/foods/types";
import { db } from "@/lib/db";
import { forGrams } from "@/lib/nutrition";
import { cookedInfo, weighCooked, type CookedContext } from "./cooked";
import { loadPairs, PAIRS } from "./pairs";
import { getBaseYields, saveWeighing } from "./store";

const pastaRaw: FoodItem = { id: "ciqual:9810", name: "Pâtes sèches, crues", per100g: { kcal: 364, protein: 12, carbs: 72.7, fat: 1.6, fiber: 2.91 }, portions: [] };
const pastaCooked: FoodItem = { id: "ciqual:9811", name: "Pâtes sèches, cuites", per100g: { kcal: 167, protein: 6.1, carbs: 31.4, fat: 1.1, fiber: 2.2 }, portions: [] };
const ciqual = (id: string) => (id === pastaCooked.id ? pastaCooked : undefined);
const ctx = (over: Partial<CookedContext> = {}): CookedContext => ({ pairs: PAIRS, ciqual, baseYields: {}, ...over });

beforeEach(async () => {
  await db.foods.clear();
  await db.settings.clear();
});

// Chargement des paires
test("le fichier généré contient les paires relues à la main (pâtes, riz, poulet)", () => {
  expect(PAIRS.label).toBe("CIQUAL 2025");
  expect(PAIRS.cookedOf("ciqual:9810")).toBe("ciqual:9811");
  expect(PAIRS.cookedOf("ciqual:9100")).toBe("ciqual:9104");
  expect(PAIRS.cookedOf("ciqual:36017")).toBe("ciqual:36018");
});
test("paire « a_revoir » ou à plusieurs cuissons : pas de paire, pesée seule", () => {
  expect(PAIRS.cookedOf("ciqual:20009")).toBeUndefined(); // carotte : a_revoir
  expect(PAIRS.cookedOf("ciqual:26043")).toBeUndefined(); // cabillaud : rôti ou vapeur
  expect(PAIRS.isWeighable("ciqual:26043")).toBe(true);
});
test("rendements de référence : seulement les liaisons validées", () => {
  expect(PAIRS.referenceYield("ciqual:6116")).toBe(0.8);
  expect(PAIRS.referenceYield("ciqual:6103")).toBeUndefined(); // entrecôte non validée
});
test("aliment perso ou inconnu : ni paire ni pesée proposée", () => {
  expect(PAIRS.cookedOf("abc-123")).toBeUndefined();
  expect(PAIRS.isWeighable("abc-123")).toBe(false);
});
test("fichier mal formé : erreur au chargement", () => {
  expect(() => loadPairs({ ciqual: "x", pairs: { 1: 2 } })).toThrow();
  const p = loadPairs({ ciqual: "T", pairs: { "1": "2" }, referenceYields: {}, weighable: ["3"] });
  expect(p.cookedOf("ciqual:1")).toBe("ciqual:2");
  expect(p.isWeighable("ciqual:3")).toBe(true);
});

// Choix de la source
test("sans pesée : valeur cuite CIQUAL, avec son nom", () => {
  const i = cookedInfo(pastaRaw, ctx());
  expect(i).toMatchObject({ available: true, cookedName: "Pâtes sèches, cuites", cooked: { source: "ciqual-cooked" } });
});
test("table CIQUAL pas encore chargée : choix affiché, pas de valeur", () => {
  expect(cookedInfo(pastaRaw, ctx({ ciqual: () => undefined }))).toEqual({ available: true, cooked: null, cookedName: undefined });
});
test("cru sans version cuite : choix affiché pour faire sa pesée", () => {
  const cod = { ...pastaRaw, id: "ciqual:26043" };
  expect(cookedInfo(cod, ctx())).toMatchObject({ available: true, cooked: null });
});
test("produit sans pesée : pas de choix cru / cuit", () => {
  expect(cookedInfo({ ...pastaRaw, id: "abc" }, ctx()).available).toBe(false);
});

// Pesée enregistrée prioritaire
test("pesée de l'aliment de base : passe avant CIQUAL et elle est rangée dans les réglages", async () => {
  expect(await saveWeighing("ciqual:9810", 100, 220)).toBeCloseTo(2.2);
  const baseYields = await getBaseYields();
  const i = cookedInfo(pastaRaw, ctx({ baseYields }));
  expect(i.cooked?.source).toBe("base-weighing");
  expect(i.cooked?.yield).toBeCloseTo(2.2);
  expect(Math.round(cookedMacros(i.cooked!.per100g, 319).kcal)).toBe(528);
});
test("pesée du produit : rangée sur l'aliment, passe avant celle de l'aliment de base", async () => {
  const f = await saveFood({ source: "off", name: "Pâtes protéinées", per100g: { kcal: 350, protein: 25, carbs: 50, fat: 2 }, portions: [] });
  await saveWeighing(f.id, 100, 250);
  const saved = await db.foods.get(f.id);
  expect(saved?.cookedYield).toBe(2.5);
  const item = { ...pastaRaw, id: f.id };
  expect(cookedInfo(item, ctx({ productYield: saved?.cookedYield, baseYields: { [f.id]: 2.2 } })).cooked?.source).toBe("product-weighing");
});
test("pesée d'un aliment introuvable : erreur explicite", async () => {
  await expect(saveWeighing("absent", 100, 200)).rejects.toThrow("cooked.food-missing");
});

// Ce qui part dans la saisie
test("pesé cuit : la saisie garde les valeurs pour 100 g cuits, le total est celui mangé", () => {
  const c = cookedInfo(pastaRaw, ctx({ baseYields: { "ciqual:9810": 2.2 } })).cooked;
  const w = weighCooked(pastaRaw, c, 319, "Pâtes, pesé cuit");
  expect(w.food.id).toBe(pastaRaw.id);
  expect(w.food.name).toBe("Pâtes, pesé cuit");
  expect(Math.round(forGrams(w.food.per100g, w.grams!).kcal)).toBe(528);
});
test("pesé cuit sans conversion : rien n'est ajouté", () => {
  expect(weighCooked(pastaRaw, null, 200, "x")).toEqual({ food: pastaRaw, grams: null });
});
