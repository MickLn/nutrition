"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";
import { loadFood } from "@/features/food-sheet/load";
import { useLang } from "@/i18n/use-t";
import { db } from "@/lib/db";
import { resolveItems, viewMenu, type Lookup, type MenuView, type Resolved } from "./menus";

/** Aliments CIQUAL et aliments enregistrés, dans la langue choisie. */
export function useLookup(): Lookup {
  const lang = useLang();
  return useCallback<Lookup>(async (id) => (await loadFood(id, lang))?.item ?? null, [lang]);
}

/** Tous les menus, avec leurs éléments et totaux (suivis en direct). undefined = chargement. */
export function useMenus(): MenuView[] | undefined {
  const lookup = useLookup();
  return useLiveQuery(async () => Promise.all((await db.menus.toArray()).map((m) => viewMenu(m, lookup))), [lookup]);
}

/** Un menu par son id. undefined = chargement, null = introuvable. */
export function useMenu(id: string | null): MenuView | null | undefined {
  const lookup = useLookup();
  return useLiveQuery(async () => {
    const m = id ? await db.menus.get(id) : undefined;
    return m ? viewMenu(m, lookup) : null;
  }, [id, lookup]);
}

/** Les plats (brique recettes), prêts à entrer dans un menu : une part par défaut. */
export function useDishes(): Resolved[] | undefined {
  const lookup = useLookup();
  return useLiveQuery(async () => {
    const recipes = (await db.recipes.toArray()).filter((r) => !r.finishedAt);
    const items = await resolveItems(
      recipes.map((r) => ({ refType: "recipe" as const, refId: r.id, grams: 0 })),
      lookup,
    );
    return items.map((i) => ({ ...i, grams: Math.round(i.portionG ?? 0) })).sort((a, b) => a.name.localeCompare(b.name));
  }, [lookup]);
}
