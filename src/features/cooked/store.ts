import { yieldFrom } from "@/bricks/cooked/cooked";
import { getFood, saveFood } from "@/features/foods/store";
import { db } from "@/lib/db";
import { weighingTarget } from "./cooked";

/** Réglage où sont rangées les pesées des aliments de base : { « ciqual:9810 »: 2.2 }. */
export const BASE_YIELDS_KEY = "cooked-base-yields";

export async function getBaseYields(): Promise<Record<string, number>> {
  const v = (await db.settings.get(BASE_YIELDS_KEY))?.value;
  return v && typeof v === "object" ? (v as Record<string, number>) : {};
}

/** Enregistre « Ma pesée » (cru puis cuit) et renvoie le rendement. */
export async function saveWeighing(foodId: string, rawG: number, cookedG: number): Promise<number> {
  const y = yieldFrom(rawG, cookedG);
  if (weighingTarget(foodId) === "base") {
    await db.settings.put({ key: BASE_YIELDS_KEY, value: { ...(await getBaseYields()), [foodId]: y } });
  } else {
    const food = await getFood(foodId);
    if (!food) throw new Error("cooked.food-missing");
    await saveFood({ ...food, cookedYield: y });
  }
  return y;
}
