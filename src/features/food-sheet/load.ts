"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { ciqualFoods, fromCustom } from "@/features/foods/catalog";
import { getFood } from "@/features/foods/store";
import type { FoodItem } from "@/features/foods/types";
import { useLang } from "@/i18n/use-t";
import type { Food } from "@/lib/db";

/** Un aliment par son id : « ciqual:… » dans la table CIQUAL, sinon dans les aliments enregistrés (`food` est alors rempli). */
export async function loadFood(id: string, lang: string): Promise<{ item: FoodItem; food?: Food } | null> {
  if (id.startsWith("ciqual:")) {
    const item = (await ciqualFoods(lang)).find((f) => f.id === id);
    return item ? { item } : null;
  }
  const food = await getFood(id);
  return food ? { item: fromCustom(food), food } : null;
}

/** Suit l'aliment en direct (un aliment perso modifié se met à jour). undefined = chargement, null = introuvable. */
export function useFood(id: string | null) {
  const lang = useLang();
  return useLiveQuery(async () => (id ? loadFood(id, lang).catch(() => null) : null), [id, lang]);
}

/** Aliment présélectionné par l'URL de la saisie (« /ajouter/?food=<id> »). */
export function usePresetFood(id: string | null): FoodItem | null | undefined {
  const found = useFood(id);
  return found === undefined ? undefined : (found?.item ?? null);
}
