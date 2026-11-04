import MiniSearch from "minisearch";
import { db, type Food } from "@/lib/db";
import type { FoodItem } from "./types";

/**
 * Catalogue d'aliments : table CIQUAL (fichiers dans public/data, hors ligne) + aliments perso (base locale).
 * Les noms CIQUAL viennent d'un fichier par langue ; s'il manque, on prend l'anglais.
 */
type CiqualFile = { fields: string[]; foods: Record<string, number[]> };

const FALLBACK_LANG = "en";
const cache = new Map<string, Promise<FoodItem[]>>();

/** Minuscules, sans accents : « pate » trouve « pâtes ». */
export const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

async function getJSON<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  return res.ok ? ((await res.json()) as T) : null;
}

export function ciqualFoods(lang: string): Promise<FoodItem[]> {
  if (!cache.has(lang)) {
    const p = (async () => {
      const [data, names] = await Promise.all([
        getJSON<CiqualFile>("/data/ciqual.json"),
        getJSON<Record<string, string>>(`/data/ciqual-names.${lang}.json`).then(
          (n) => n ?? getJSON<Record<string, string>>(`/data/ciqual-names.${FALLBACK_LANG}.json`),
        ),
      ]);
      if (!data || !names) throw new Error("ciqual-missing");
      const at = (k: string) => data.fields.indexOf(k);
      return Object.entries(data.foods).map(([code, v]) => ({
        id: `ciqual:${code}`,
        name: names[code] ?? code,
        per100g: { kcal: v[at("kcal")], protein: v[at("protein")], carbs: v[at("carbs")], fat: v[at("fat")], fiber: v[at("fiber")] },
        portions: [],
      }));
    })();
    p.catch(() => cache.delete(lang));
    cache.set(lang, p);
  }
  return cache.get(lang)!;
}

export function fromCustom(f: Food): FoodItem {
  return { id: f.id, name: f.brand ? `${f.name} ${f.brand}` : f.name, per100g: { ...f.per100g, fiber: f.per100g.fiber ?? 0 }, portions: f.portions };
}

/** Index de recherche : tolère une faute de frappe et les débuts de mots. Les aliments perso passent devant à score égal. */
export function buildIndex(items: FoodItem[]) {
  const index = new MiniSearch<FoodItem>({
    fields: ["name"],
    storeFields: ["id"],
    processTerm: (term) => normalize(term),
    searchOptions: { prefix: true, fuzzy: 0.2, combineWith: "AND" },
  });
  index.addAll(items);
  const byId = new Map(items.map((i) => [i.id, i]));
  return (query: string, limit: number): FoodItem[] =>
    index
      .search(query, { boostDocument: (id) => (String(id).startsWith("ciqual:") ? 1 : 1.5) })
      .slice(0, limit)
      .map((r) => byId.get(String(r.id))!);
}

export async function loadSearch(lang: string) {
  const [ciqual, custom] = await Promise.all([ciqualFoods(lang), db.foods.toArray()]);
  return buildIndex([...custom.map(fromCustom), ...ciqual]);
}
