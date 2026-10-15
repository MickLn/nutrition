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
  per100g: Macros;
  portions: { label: string; grams: number }[];
  nutriscore?: string;
  /** Image Open Food Facts : on garde l'URL, le service worker met la vignette en cache. */
  imageUrl?: string;
  /** Photo prise par l'utilisateur (table images). */
  imageId?: string;
  updatedAt: number;
};

export type Recipe = {
  id: string;
  name: string;
  ingredients: { foodId: string; grams: number }[];
  cookedWeightG?: number;
  servings: number;
  updatedAt: number;
};

export type Meal = "breakfast" | "lunch" | "dinner" | "snack";

export type LogEntry = {
  id: string;
  /** AAAA-MM-JJ */
  date: string;
  meal: Meal;
  refType: "food" | "recipe";
  refId: string;
  name: string;
  grams: number;
  /** Copie figée des valeurs au moment de la saisie : modifier l'aliment ne réécrit pas l'historique. */
  snapshot: Macros;
  updatedAt: number;
};

export type Favorite = {
  id: string;
  name: string;
  items: { refType: "food" | "recipe"; refId: string; grams: number }[];
  updatedAt: number;
};

export type Weight = {
  id: string;
  date: string;
  kg: number;
  source: "manual" | "shortcut";
  updatedAt: number;
};

export type ImageBlob = { id: string; blob: Blob; createdAt: number };

export type Setting = { key: string; value: unknown };

export const SCHEMA_VERSION = 1;

export class NutritionDB extends Dexie {
  foods!: EntityTable<Food, "id">;
  recipes!: EntityTable<Recipe, "id">;
  logEntries!: EntityTable<LogEntry, "id">;
  favorites!: EntityTable<Favorite, "id">;
  weights!: EntityTable<Weight, "id">;
  images!: EntityTable<ImageBlob, "id">;
  settings!: EntityTable<Setting, "key">;

  constructor() {
    super("nutrition");
    this.version(SCHEMA_VERSION).stores({
      foods: "id, source, name, barcode, updatedAt",
      recipes: "id, name, updatedAt",
      logEntries: "id, date, [date+meal], refId, updatedAt",
      favorites: "id, name",
      weights: "id, date",
      images: "id",
      settings: "key",
    });
  }
}

export const db = new NutritionDB();

export const DATA_TABLES = ["foods", "recipes", "logEntries", "favorites", "weights", "settings"] as const;
