"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { partsOf } from "./store";

/** Un plat en direct : undefined pendant le chargement, null s'il n'existe pas. */
export function useDish(id: string | null) {
  return useLiveQuery(async () => (id ? ((await db.recipes.get(id)) ?? null) : null), [id]);
}

/** Tous les plats et plats en lot. */
export function useDishes() {
  return useLiveQuery(() => db.recipes.toArray(), []);
}

/** Parts mangées d'un plat (entrées du journal). */
export function useParts(id: string | null) {
  return useLiveQuery(async () => (id ? partsOf(id) : []), [id]);
}
