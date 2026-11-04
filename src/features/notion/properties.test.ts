import { expect, test } from "vitest";
import { NOTION } from "@/config/notion";
import { databaseSchema, foodProperties, menuProperties, recipeProperties } from "./properties";

const C = NOTION.columns;

test("aliment : colonnes et valeurs", () => {
  const p = foodProperties("f1", { name: "Skyr", brand: "Danone", source: "off", kcal: 60, protein: 10, carbs: 4, fat: 0.2, fiber: null, updatedAt: 0 });
  expect(p[C.title]).toEqual({ title: [{ type: "text", text: { content: "Skyr" } }] });
  expect(p[C.appId]).toEqual({ rich_text: [{ type: "text", text: { content: "f1" } }] });
  expect(p[C.source]).toEqual({ select: { name: NOTION.sourceLabels.off } });
  expect(p[C.protein]).toEqual({ number: 10 });
  expect(p[C.fiber]).toEqual({ number: null });
  expect(p[C.barcode]).toEqual({ rich_text: [] });
  expect(p[C.updated]).toEqual({ date: { start: "1970-01-01T00:00:00.000Z" } });
});

test("plat : ingrédients en texte", () => {
  const p = recipeProperties("r1", {
    name: "Chili",
    type: "batch",
    servings: 4,
    cookedWeightG: 1200,
    ingredients: [{ name: "Riz", grams: 200 }, { name: "Boeuf", grams: 350.25 }],
    updatedAt: 0,
  });
  expect(p[C.type]).toEqual({ select: { name: NOTION.typeLabels.batch } });
  expect(p[C.cookedWeight]).toEqual({ number: 1200 });
  expect(JSON.stringify(p[C.ingredients])).toContain("Riz : 200 g\\nBoeuf : 350.3 g");
});

test("menu : contenu tronqué à la limite de Notion", () => {
  const items = Array.from({ length: 100 }, (_, i) => ({ name: "Aliment très long numéro " + i, grams: 100 }));
  const p = menuProperties("m1", { name: "Petit-déj", items, updatedAt: 0 });
  const content = (p[C.content] as { rich_text: { text: { content: string } }[] }).rich_text[0].text.content;
  expect(content.length).toBeLessThanOrEqual(NOTION.maxRichText);
});

test("chaque base a un titre et la colonne « ID app »", () => {
  for (const k of ["food", "recipe", "menu"] as const) {
    const s = databaseSchema(k);
    expect(s[C.title]).toEqual({ title: {} });
    expect(s[C.appId]).toEqual({ rich_text: {} });
  }
});
