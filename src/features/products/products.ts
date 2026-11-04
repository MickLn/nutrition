import { FOOD } from "@/config/food";
import { PRODUCTS } from "@/config/products";
import { normalize } from "@/features/foods/catalog";
import { db, type Food } from "@/lib/db";

/** Filtre de l'onglet Produits : Récents, A à Z, Favoris. */
export type ProductSort = "recent" | "az" | "fav";

/** Nom affiché d'un produit : la marque suit le nom, comme dans la recherche de la saisie. */
export const productName = (f: Food) => (f.brand ? `${f.name} ${f.brand}` : f.name);

/** Tous les mots tapés doivent se trouver dans le nom ou la marque (sans accents ni majuscules). */
export function matchesQuery(f: Food, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const hay = normalize(productName(f));
  return words.every((w) => hay.includes(w));
}

export const isFavorite = (f: Food) => !!f.tags?.includes(PRODUCTS.favoriteTag);

/**
 * Trie et filtre les produits. « Récents » : dernier repas noté avec ce produit, sinon date d'ajout ou de modification.
 * « A à Z » et « Favoris » : ordre alphabétique de la langue.
 */
export function sortProducts(foods: Food[], opts: { sort: ProductSort; query?: string; lastUsed?: Map<string, number>; locale?: string }): Food[] {
  const { sort, query = "", lastUsed = new Map(), locale = "fr" } = opts;
  const list = foods.filter((f) => matchesQuery(f, query) && (sort !== "fav" || isFavorite(f)));
  if (sort === "recent") {
    const when = (f: Food) => Math.max(lastUsed.get(f.id) ?? 0, f.updatedAt);
    return list.sort((a, b) => when(b) - when(a));
  }
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  return list.sort((a, b) => collator.compare(productName(a), productName(b)));
}

/** Lettre de section d'un nom : « Écrasé » → E, « Œuf » → O, « 7 Up » → #. */
export function sectionLetter(name: string): string {
  const c = normalize(name.trim()).replace(/^œ/, "o").replace(/^æ/, "a").charAt(0).toUpperCase();
  return c >= "A" && c <= "Z" ? c : PRODUCTS.otherLetter;
}

/** Regroupe une liste déjà triée par lettre, dans l'ordre de la liste. */
export function groupByLetter(foods: Food[]): { letter: string; foods: Food[] }[] {
  const groups: { letter: string; foods: Food[] }[] = [];
  for (const f of foods) {
    const letter = sectionLetter(productName(f));
    const last = groups.at(-1);
    if (last?.letter === letter) last.foods.push(f);
    else groups.push({ letter, foods: [f] });
  }
  return groups;
}

/** Quantité montrée sous le nom : la première portion du produit, sinon 100 g ; et ses calories. */
export function productPortion(f: Food): { grams: number; kcal: number } {
  const grams = f.portions[0]?.grams ?? FOOD.referenceGrams;
  return { grams, kcal: (f.per100g.kcal * grams) / 100 };
}

/** Produits enregistrés sur le téléphone (scannés et aliments perso). */
export function allProducts(): Promise<Food[]> {
  return db.foods.where("source").anyOf([...PRODUCTS.sources]).toArray();
}

/** Liste de l'onglet Produits : lecture de la base, puis tri et filtre de `sortProducts`. */
export async function listProducts(opts: { sort: ProductSort; query?: string; locale?: string }): Promise<Food[]> {
  const foods = await allProducts();
  let lastUsed: Map<string, number> | undefined;
  if (opts.sort === "recent" && foods.length) {
    const rows = await db.logEntries.where("refId").anyOf(foods.map((f) => f.id)).toArray();
    lastUsed = new Map();
    for (const r of rows) lastUsed.set(r.refId, Math.max(lastUsed.get(r.refId) ?? 0, r.updatedAt));
  }
  return sortProducts(foods, { ...opts, lastUsed });
}

/** Nombre de produits enregistrés (0 : état vide de l'onglet). */
export function countProducts(): Promise<number> {
  return db.foods.where("source").anyOf([...PRODUCTS.sources]).count();
}
