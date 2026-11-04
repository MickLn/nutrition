import { NOTION } from "@/config/notion";
import type { FoodData, Kind, MenuData, NotionData, RecipeData } from "./schema";

/** Construction des colonnes Notion à partir des données de l'app (logique pure, testée). */
const C = NOTION.columns;

const title = (s: string) => ({ title: [{ type: "text", text: { content: s.slice(0, NOTION.maxText) } }] });
const rich = (s: string) => ({ rich_text: s ? [{ type: "text", text: { content: s.slice(0, NOTION.maxRichText) } }] : [] });
const number = (v: number | null | undefined) => ({ number: typeof v === "number" && Number.isFinite(v) ? v : null });
const select = (name: string) => ({ select: { name } });
const date = (ms: number) => ({ date: { start: new Date(ms).toISOString() } });

const grams = (g: number) => `${Math.round(g * 10) / 10} g`;
const lines = (list: { name: string; grams: number }[]) => list.map((l) => `${l.name} : ${grams(l.grams)}`).join("\n");

export function foodProperties(id: string, d: FoodData) {
  return {
    [C.title]: title(d.name),
    [C.appId]: rich(id),
    [C.source]: select(NOTION.sourceLabels[d.source]),
    [C.brand]: rich(d.brand ?? ""),
    [C.barcode]: rich(d.barcode ?? ""),
    [C.kcal]: number(d.kcal),
    [C.protein]: number(d.protein),
    [C.carbs]: number(d.carbs),
    [C.fat]: number(d.fat),
    [C.fiber]: number(d.fiber),
    [C.updated]: date(d.updatedAt),
  };
}

export function recipeProperties(id: string, d: RecipeData) {
  return {
    [C.title]: title(d.name),
    [C.appId]: rich(id),
    [C.type]: select(NOTION.typeLabels[d.type]),
    [C.servings]: number(d.servings),
    [C.cookedWeight]: number(d.cookedWeightG),
    [C.ingredients]: rich(lines(d.ingredients)),
    [C.updated]: date(d.updatedAt),
  };
}

export function menuProperties(id: string, d: MenuData) {
  return {
    [C.title]: title(d.name),
    [C.appId]: rich(id),
    [C.content]: rich(lines(d.items)),
    [C.updated]: date(d.updatedAt),
  };
}

export function propertiesFor(kind: Kind, id: string, d: NotionData) {
  if (kind === "food") return foodProperties(id, d as FoodData);
  if (kind === "recipe") return recipeProperties(id, d as RecipeData);
  return menuProperties(id, d as MenuData);
}

/** Colonnes à créer avec chaque base (la colonne titre existe toujours). */
export function databaseSchema(kind: Kind) {
  const base = { [C.title]: { title: {} }, [C.appId]: { rich_text: {} }, [C.updated]: { date: {} } };
  const opts = (names: readonly string[]) => ({ select: { options: names.map((name) => ({ name })) } });
  if (kind === "food")
    return {
      ...base,
      [C.source]: opts(Object.values(NOTION.sourceLabels)),
      [C.brand]: { rich_text: {} },
      [C.barcode]: { rich_text: {} },
      [C.kcal]: { number: {} },
      [C.protein]: { number: {} },
      [C.carbs]: { number: {} },
      [C.fat]: { number: {} },
      [C.fiber]: { number: {} },
    };
  if (kind === "recipe")
    return {
      ...base,
      [C.type]: opts(Object.values(NOTION.typeLabels)),
      [C.servings]: { number: {} },
      [C.cookedWeight]: { number: {} },
      [C.ingredients]: { rich_text: {} },
    };
  return { ...base, [C.content]: { rich_text: {} } };
}
