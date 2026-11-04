import { batchTotals, scale } from "@/bricks/batch/math";
import { normalize } from "@/features/foods/catalog";
import type { FoodItem } from "@/features/foods/types";
import { addEntries, nowHHMM } from "@/features/journal/journal";
import { db, type Meal, type Menu, type Recipe } from "@/lib/db";
import { addCore, forGrams, ZERO, type Core } from "@/lib/nutrition";

/**
 * Brique « Menus » : des aliments (et des plats) mangés ensemble, enregistrés une fois et ajoutés en un tap.
 * Les entrées du journal gardent une copie figée des valeurs : modifier un menu ne réécrit pas les jours passés,
 * et corriger un poids au moment de l'ajout ne change pas le menu.
 */

export type MenuItem = Menu["items"][number];

/** Trouve un aliment par son id (CIQUAL ou aliment enregistré). Injecté pour les tests. */
export type Lookup = (foodId: string) => Promise<FoodItem | null>;

/** Un élément de menu avec son nom et ses valeurs pour 100 g. `portionG` : poids d'une part (plats seulement). */
export type Resolved = MenuItem & { name: string; per100g: FoodItem["per100g"]; portionG?: number };

/** Un menu prêt à afficher : éléments retrouvés et total. */
export type MenuView = Omit<Menu, "items"> & { items: Resolved[]; total: Core };

export type SortMode = "recent" | "az" | "fav";

/**
 * Valeurs d'un plat pour 100 g : ingrédients crus additionnés, rapportés au poids cuit (à défaut, au poids cru total).
 * Un ingrédient introuvable compte pour 0. Renvoie null pour un plat sans poids.
 */
export function recipeNutrition(
  recipe: Pick<Recipe, "ingredients" | "cookedWeightG" | "servings">,
  per100: Map<string, FoodItem["per100g"]>,
): { per100g: FoodItem["per100g"]; weightG: number; portionG: number } | null {
  const known = recipe.ingredients.filter((i) => per100.has(i.foodId));
  const raw = recipe.ingredients.reduce((s, i) => s + i.grams, 0);
  const weightG = recipe.cookedWeightG && recipe.cookedWeightG > 0 ? recipe.cookedWeightG : raw;
  if (!(weightG > 0)) return null;
  const total = batchTotals(known.map((i) => ({ per100g: per100.get(i.foodId)!, grams: i.grams })));
  return { per100g: scale(total, 100 / weightG), weightG, portionG: weightG / Math.max(1, recipe.servings || 1) };
}

/** Total d'une liste d'éléments pesés. */
export function itemsTotal(items: { per100g: FoodItem["per100g"]; grams: number }[]): Core {
  return items.reduce((acc, i) => addCore(acc, forGrams(i.per100g, i.grams)), ZERO);
}

/** Nombre de parts d'un plat pour un poids donné, au dixième. */
export function partsOf(grams: number, portionG: number | undefined): number {
  return portionG && portionG > 0 ? Math.round((grams / portionG) * 10) / 10 : 0;
}

/** Change la quantité d'un élément d'un pas (− ou +). Jamais en dessous de 0 : à 0, l'élément est retiré. */
export function step(grams: number, delta: number): number {
  return Math.max(0, Math.round((grams + delta) * 10) / 10);
}

/** Retrouve chaque élément (aliment ou plat). Un élément introuvable est laissé de côté. */
export async function resolveItems(items: MenuItem[], lookup: Lookup): Promise<Resolved[]> {
  const found = await Promise.all(
    items.map(async (item): Promise<Resolved | null> => {
      try {
        if (item.refType === "food") {
          const f = await lookup(item.refId);
          return f ? { ...item, name: f.name, per100g: f.per100g } : null;
        }
        const recipe = await db.recipes.get(item.refId);
        if (!recipe) return null;
        const per100 = new Map<string, FoodItem["per100g"]>();
        for (const ing of recipe.ingredients) {
          const f = await lookup(ing.foodId);
          if (f) per100.set(ing.foodId, f.per100g);
        }
        const r = recipeNutrition(recipe, per100);
        return r ? { ...item, name: recipe.name, per100g: r.per100g, portionG: r.portionG } : null;
      } catch {
        return null;
      }
    }),
  );
  return found.filter((x): x is Resolved => x !== null);
}

/** Un menu avec ses éléments retrouvés et son total. */
export async function viewMenu(menu: Menu, lookup: Lookup): Promise<MenuView> {
  const items = await resolveItems(menu.items, lookup);
  return { ...menu, items, total: itemsTotal(items) };
}

/** Recherche par nom (sans accents), filtre « Favoris », tri « Récents » (dernier ajout) ou « A à Z ». */
export function sortMenus<T extends Pick<Menu, "name" | "updatedAt" | "usedAt" | "favorite">>(menus: T[], mode: SortMode, query = "", locale?: string): T[] {
  const q = normalize(query.trim());
  const list = menus.filter((m) => (!q || normalize(m.name).includes(q)) && (mode !== "fav" || m.favorite));
  const recent = (m: T) => m.usedAt ?? m.updatedAt;
  return list.sort(mode === "az" ? (a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base" }) : (a, b) => recent(b) - recent(a));
}

/** Éléments à donner au journal : chaque élément devient une entrée avec la copie de ses valeurs. */
export function toEntries(items: Resolved[]): { food: FoodItem; grams: number; refType: MenuItem["refType"] }[] {
  return items.map((i) => ({ food: { id: i.refId, name: i.name, per100g: i.per100g, portions: [] }, grams: i.grams, refType: i.refType }));
}

export type MenuDraft = { id?: string; name: string; items: MenuItem[]; favorite?: boolean };

/** Enregistre un nouveau menu ou le modifie. Les éléments à 0 g sont retirés. */
export async function saveMenu(d: MenuDraft): Promise<Menu> {
  const prev = d.id ? await db.menus.get(d.id) : undefined;
  const menu: Menu = {
    ...prev,
    id: prev?.id ?? d.id ?? crypto.randomUUID(),
    name: d.name.trim(),
    items: d.items.filter((i) => i.grams > 0).map(({ refType, refId, grams }) => ({ refType, refId, grams })),
    favorite: !!d.favorite,
    updatedAt: Date.now(),
  };
  await db.menus.put(menu);
  return menu;
}

/** Supprime un menu ; la fonction renvoyée le remet (bouton « Annuler »). */
export async function deleteMenu(id: string): Promise<() => Promise<void>> {
  const menu = await db.menus.get(id);
  await db.menus.delete(id);
  return async () => {
    if (menu) await db.menus.put(menu);
  };
}

/**
 * Ajoute les éléments d'un menu à un repas (quantités éventuellement corrigées pour cette fois).
 * Le menu passe en tête des « Récents ». La fonction `undo` retire les entrées ajoutées.
 */
export async function addMenuToMeal(
  menuId: string | null,
  items: Resolved[],
  date: string,
  meal: Meal,
  time = nowHHMM(),
): Promise<{ count: number; undo: () => Promise<void> }> {
  const rows = await addEntries(date, meal, toEntries(items), time);
  const prev = menuId ? await db.menus.get(menuId) : undefined;
  if (prev) await db.menus.update(prev.id, { usedAt: Date.now() });
  return {
    count: rows.length,
    undo: async () => {
      await db.logEntries.bulkDelete(rows.map((r) => r.id));
      if (prev) await db.menus.update(prev.id, { usedAt: prev.usedAt });
    },
  };
}

/** Clé d'un élément : un même aliment ou plat n'apparaît qu'une fois dans un menu. */
export const itemKey = (i: Pick<MenuItem, "refType" | "refId">) => `${i.refType}:${i.refId}`;

/** Ajoute des éléments à une liste sans doublon : un élément déjà présent garde sa quantité ; rien à 0 g. */
export function mergeItems<T extends MenuItem>(xs: T[], added: T[]): T[] {
  const seen = new Set(xs.map(itemKey));
  const out = [...xs];
  for (const a of added) {
    if (a.grams <= 0 || seen.has(itemKey(a))) continue;
    seen.add(itemKey(a));
    out.push(a);
  }
  return out;
}
