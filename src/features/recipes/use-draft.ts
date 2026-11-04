"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Recipe } from "@/lib/db";
import type { DishDraft } from "./dish";

/** Brouillon de départ du formulaire de plat : le plat à modifier, ou les aliments d'une saisie (« Enregistrer comme recette ? »). */
export async function loadDraft(opts: { id?: string | null; entries?: string | null; name?: string | null; batch?: boolean }): Promise<{ draft: DishDraft; previous?: Recipe } | null> {
  if (opts.id) {
    const r = await db.recipes.get(opts.id);
    if (!r) return null;
    return { previous: r, draft: { name: r.name, ingredients: r.ingredients, batch: r.kind === "batch", cookedG: r.cookedWeightG ?? null } };
  }
  const ids = (opts.entries ?? "").split(",").filter(Boolean);
  const rows = ids.length ? (await db.logEntries.bulkGet(ids)).filter((e) => !!e && e.refType === "food") : [];
  const ingredients = rows.map((e) => ({ foodId: e!.refId, grams: e!.grams, name: e!.name, per100g: e!.snapshot }));
  return { draft: { name: opts.name ?? "", ingredients, batch: !!opts.batch, cookedG: null } };
}

/** undefined pendant le chargement, null si le plat à modifier n'existe plus. */
export function useDraft(opts: { id?: string | null; entries?: string | null; name?: string | null; batch?: boolean }) {
  return useLiveQuery(() => loadDraft(opts), [opts.id, opts.entries, opts.name, opts.batch]);
}
