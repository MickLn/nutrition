"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { portionShortcut, quantityCheck } from "@/engine/entry";
import { pastGrams } from "./journal";

/** Raccourci de portion et alerte de quantité pour un aliment, d'après ses saisies passées. */
export function usePortions(refId: string, excludeLast = false) {
  const past = useLiveQuery(async () => {
    const g = await pastGrams(refId);
    return excludeLast ? g.slice(0, -1) : g;
  }, [refId, excludeLast]);
  return {
    shortcut: past ? portionShortcut(past) : null,
    check: (grams: number) => (past ? quantityCheck(grams, past) : "ok"),
  };
}
