import { addEntries } from "@/features/journal/journal";
import { db, type LogEntry, type Meal, type Recipe } from "@/lib/db";
import { afterPart, declareRemaining, discardRest, dishItem, draftToRecipe, type DishDraft } from "./dish";

/**
 * Plats enregistrés (table recipes). Les autres briques (Menus, saisie) passent par ces fonctions.
 * Une part mangée est une entrée du journal `refType: "recipe"`, `refId` = id du plat, avec une copie figée
 * des valeurs pour 100 g : modifier ou supprimer le plat ne réécrit pas les jours passés.
 */
export function getDish(id: string): Promise<Recipe | undefined> {
  return db.recipes.get(id);
}

export function allDishes(): Promise<Recipe[]> {
  return db.recipes.toArray();
}

/** Enregistre un nouveau plat ou le plat modifié. */
export async function saveDish(draft: DishDraft, previous?: Recipe): Promise<Recipe> {
  const recipe = draftToRecipe(draft, previous?.id ?? crypto.randomUUID(), previous);
  await db.recipes.put(recipe);
  return recipe;
}

/** Supprime le plat ; les repas déjà notés restent. La fonction renvoyée le remet (« Annuler »). */
export async function deleteDish(id: string): Promise<() => Promise<void>> {
  const row = await db.recipes.get(id);
  await db.recipes.delete(id);
  return async () => {
    if (row) await db.recipes.put(row);
  };
}

/** Ajoute une part au repas et retire son poids du plat en lot. Renvoie le plat à jour. */
export async function eatPart(recipe: Recipe, date: string, meal: Meal, grams: number): Promise<Recipe> {
  return db.transaction("rw", db.recipes, db.logEntries, async () => {
    const fresh = (await db.recipes.get(recipe.id)) ?? recipe;
    await addEntries(date, meal, [{ food: dishItem(fresh), grams, refType: "recipe" }]);
    const patch = afterPart(fresh, grams);
    await db.recipes.update(fresh.id, patch);
    return { ...fresh, ...patch };
  });
}

/** Applique une correction au plat ; la fonction renvoyée remet l'état d'avant. */
async function patchWithUndo(id: string, make: (r: Recipe) => Partial<Recipe>): Promise<() => Promise<void>> {
  const before = await db.recipes.get(id);
  if (!before) return async () => {};
  await db.recipes.update(id, make(before));
  return async () => {
    await db.recipes.put(before);
  };
}

/** « Il reste X g » : rien n'est compté dans le journal. */
export const setRemaining = (id: string, grams: number) => patchWithUndo(id, (r) => declareRemaining(r, grams));

/** « Jeter le reste » : le plat est terminé, rien n'est compté. */
export const throwRest = (id: string) => patchWithUndo(id, () => discardRest());

/** Parts déjà mangées d'un plat, de la plus ancienne à la plus récente. */
export async function partsOf(id: string): Promise<LogEntry[]> {
  const rows = await db.logEntries.where("refId").equals(id).toArray();
  return rows.filter((r) => r.refType === "recipe").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
