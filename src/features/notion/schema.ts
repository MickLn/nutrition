import { z } from "zod";
import { NOTION } from "@/config/notion";

/** Ce que l'app envoie au serveur, et ce que le serveur vérifie. Partagé, sans dépendance au navigateur. */
const text = z.string().max(NOTION.maxText);
const num = z.number().finite();

export const foodData = z.object({
  name: text.min(1),
  brand: text.optional(),
  barcode: z.string().max(64).optional(),
  source: z.enum(["custom", "off"]),
  kcal: num,
  protein: num,
  carbs: num,
  fat: num,
  fiber: num.nullable().optional(),
  updatedAt: num,
});

const line = z.object({ name: text, grams: num });

export const recipeData = z.object({
  name: text.min(1),
  type: z.enum(["recipe", "batch"]),
  servings: num,
  cookedWeightG: num.nullable().optional(),
  ingredients: z.array(line).max(NOTION.maxListItems),
  updatedAt: num,
});

export const menuData = z.object({
  name: text.min(1),
  items: z.array(line).max(NOTION.maxListItems),
  updatedAt: num,
});

export type FoodData = z.infer<typeof foodData>;
export type RecipeData = z.infer<typeof recipeData>;
export type MenuData = z.infer<typeof menuData>;
export type NotionData = FoodData | RecipeData | MenuData;
export type Kind = "food" | "recipe" | "menu";

export const dataSchemas = { food: foodData, recipe: recipeData, menu: menuData } as const;

export const kinds = ["food", "recipe", "menu"] as const;

/** Corps d'une requête POST. Les données de chaque élément sont vérifiées une par une côté serveur. */
export const requestBody = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(kinds),
        id: z.string().min(1).max(100),
        op: z.enum(["upsert", "archive"]),
        data: z.unknown().optional(),
      }),
    )
    .min(1)
    .max(NOTION.batchSize),
});

export type OutgoingItem = { kind: Kind; id: string; op: "upsert" | "archive"; data?: NotionData };
export type SyncResponse = { done: string[]; failed: string[] };
