import Dexie, { type EntityTable } from "dexie";

export type Macros = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number | null;
  sugars?: number | null;
  salt?: number | null;
};

export type Food = {
  id: string;
  source: "ciqual" | "off" | "custom";
  name: string;
  brand?: string;
  barcode?: string;
  /** Contenance affichée sur l'emballage (« 500 g »), texte libre d'Open Food Facts. Non indexé. */
  quantity?: string;
  per100g: Macros;
  /** Étiquettes libres, par exemple « light » pour les suggestions du soir. */
  tags?: string[];
  portions: { label: string; grams: number }[];
  nutriscore?: string;
  /** Image Open Food Facts : on garde l'URL, le service worker met la vignette en cache. */
  imageUrl?: string;
  /** Photo prise par l'utilisateur (table images). */
  imageId?: string;
  /** « Ma pesée » : rendement cru → cuit mesuré sur ce produit (poids cuit ÷ poids cru). Non indexé. */
  cookedYield?: number;
  updatedAt: number;
};

export type Recipe = {
  id: string;
  name: string;
  /** « recipe » : plat classique ; « batch » : plat cuisiné en grande quantité, on soustrait ce qui est mangé. */
  kind: "recipe" | "batch";
  /**
   * Ingrédients pesés crus. `name` et `per100g` (facultatifs, non indexés) sont une copie prise à l'enregistrement :
   * le plat garde ses valeurs même si l'aliment est supprimé ou change.
   */
  ingredients: { foodId: string; grams: number; name?: string; per100g?: Macros & { fiber: number } }[];
  cookedWeightG?: number;
  remainingG?: number;
  finishedAt?: number;
  /** Date où le plat a été cuisiné (« cuisiné dimanche »). Non indexé. */
  cookedAt?: number;
  /** Plat mis en favori (filtre « Favoris » de Recettes). Non indexé. */
  favorite?: boolean;
  servings: number;
  updatedAt: number;
};

export type Meal = "breakfast" | "lunch" | "dinner" | "snack";

export type LogEntry = {
  id: string;
  /** AAAA-MM-JJ */
  date: string;
  /** HH:MM, heure de la saisie. */
  time: string;
  /** Déduit de l'heure (mealFromTime), modifiable. */
  meal: Meal;
  refType: "food" | "recipe";
  refId: string;
  name: string;
  grams: number;
  /** Copie figée des valeurs pour 100 g au moment de la saisie : modifier l'aliment ne réécrit pas l'historique. */
  snapshot: Macros & { fiber: number };
  updatedAt: number;
};

/** Aliments mangés ensemble, ajoutés en un tap (ancien « Favori »). */
export type Menu = {
  id: string;
  name: string;
  items: { refType: "food" | "recipe"; refId: string; grams: number }[];
  /** Menu marqué d'une étoile (filtre « Favoris »). Non indexé. */
  favorite?: boolean;
  /** Dernier ajout au journal (tri « Récents »). Non indexé. */
  usedAt?: number;
  updatedAt: number;
};

export type Weight = {
  id: string;
  date: string;
  kg: number;
  source: "manual" | "shortcut";
  updatedAt: number;
};

export type Waist = { id: string; date: string; cm: number; updatedAt: number };

export type Water = { id: string; date: string; ml: number; updatedAt: number };

export type ImageBlob = { id: string; blob: Blob; createdAt: number };

export type Setting = { key: string; value: unknown };

export const SCHEMA_VERSION = 2;

const V1 = {
  foods: "id, source, name, barcode, updatedAt",
  recipes: "id, name, updatedAt",
  logEntries: "id, date, [date+meal], refId, updatedAt",
  favorites: "id, name",
  weights: "id, date",
  images: "id",
  settings: "key",
};

export class NutritionDB extends Dexie {
  foods!: EntityTable<Food, "id">;
  recipes!: EntityTable<Recipe, "id">;
  logEntries!: EntityTable<LogEntry, "id">;
  menus!: EntityTable<Menu, "id">;
  weights!: EntityTable<Weight, "id">;
  waists!: EntityTable<Waist, "id">;
  water!: EntityTable<Water, "id">;
  images!: EntityTable<ImageBlob, "id">;
  settings!: EntityTable<Setting, "key">;

  constructor(name = "nutrition") {
    super(name);
    this.version(1).stores(V1);
    this.version(2)
      .stores({
        ...V1,
        recipes: "id, name, kind, updatedAt",
        favorites: null,
        menus: "id, name",
        waists: "id, date",
        water: "id, date",
      })
      .upgrade(async (tx) => {
        const favs = await tx.table("favorites").toArray();
        await tx.table("menus").bulkPut(favs.map((f) => ({ updatedAt: Date.now(), ...f })));
        await tx.table("logEntries").toCollection().modify((e) => {
          e.time ??= DEFAULT_TIME;
          e.snapshot = { ...e.snapshot, fiber: e.snapshot?.fiber ?? 0 };
        });
        await tx.table("recipes").toCollection().modify((r) => {
          r.kind ??= "recipe";
        });
      });
  }
}

/** Heure donnée aux anciennes saisies qui n'en avaient pas. */
export const DEFAULT_TIME = "12:00";

export const db = new NutritionDB();

export const DATA_TABLES = ["foods", "recipes", "logEntries", "menus", "weights", "waists", "water", "settings"] as const;
