import { loadFood } from "@/features/food-sheet/load";
import { DEFAULT_LANGUAGE } from "@/i18n/languages";
import { db, type Food, type Menu, type Recipe } from "@/lib/db";
import type { FoodData, MenuData, RecipeData } from "./schema";
import { diffLibrary, type LibraryItem, type Outgoing } from "./sync";
import { getMap } from "./state";

/**
 * Lit la bibliothèque à copier : aliments créés à la main et produits scannés (jamais CIQUAL), plats, menus.
 * Jamais le journal, le poids, le tour de taille ni le profil.
 */
const round = (v: number) => Math.round(v * 10) / 10;

export function foodData(f: Food): FoodData {
  return {
    name: f.name,
    brand: f.brand || undefined,
    barcode: f.barcode || undefined,
    source: f.source === "off" ? "off" : "custom",
    kcal: round(f.per100g.kcal),
    protein: round(f.per100g.protein),
    carbs: round(f.per100g.carbs),
    fat: round(f.per100g.fat),
    fiber: typeof f.per100g.fiber === "number" ? round(f.per100g.fiber) : null,
    updatedAt: f.updatedAt,
  };
}

type NameOf = (foodId: string) => Promise<string>;

export async function recipeData(r: Recipe, nameOf: NameOf): Promise<RecipeData> {
  return {
    name: r.name,
    type: r.kind,
    servings: r.servings,
    cookedWeightG: r.cookedWeightG ?? null,
    ingredients: await Promise.all(r.ingredients.map(async (i) => ({ name: i.name ?? (await nameOf(i.foodId)), grams: round(i.grams) }))),
    updatedAt: r.updatedAt,
  };
}

export async function menuData(m: Menu, nameOf: NameOf, recipeNames: Map<string, string>): Promise<MenuData> {
  return {
    name: m.name,
    items: await Promise.all(
      m.items.map(async (i) => ({ name: i.refType === "recipe" ? (recipeNames.get(i.refId) ?? "?") : await nameOf(i.refId), grams: round(i.grams) })),
    ),
    updatedAt: m.updatedAt,
  };
}

export async function collectLibrary(): Promise<LibraryItem[]> {
  const [foods, recipes, menus] = await Promise.all([
    db.foods.where("source").anyOf("custom", "off").toArray(),
    db.recipes.toArray(),
    db.menus.toArray(),
  ]);
  const cache = new Map<string, string>();
  const nameOf: NameOf = async (id) => {
    let name = cache.get(id);
    if (name === undefined) {
      name = (await loadFood(id, DEFAULT_LANGUAGE).catch(() => null))?.item.name ?? "?";
      cache.set(id, name);
    }
    return name;
  };
  const recipeNames = new Map(recipes.map((r) => [r.id, r.name]));
  return [
    ...foods.map((f) => ({ kind: "food" as const, id: f.id, data: foodData(f) })),
    ...(await Promise.all(recipes.map(async (r) => ({ kind: "recipe" as const, id: r.id, data: await recipeData(r, nameOf) })))),
    ...(await Promise.all(menus.map(async (m) => ({ kind: "menu" as const, id: m.id, data: await menuData(m, nameOf, recipeNames) })))),
  ];
}

/** Ce qui reste à envoyer maintenant. */
export async function computeOutgoing(): Promise<Outgoing[]> {
  // La carte est lue d'abord : une lecture Dexie après un chargement CIQUAL ne serait plus suivie en direct.
  const map = await getMap();
  return diffLibrary(await collectLibrary(), map);
}
