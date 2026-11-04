"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { latestWeight } from "./draft";

/** Dernière pesée en kg (lecture seule), null s'il n'y en a aucune, undefined pendant le chargement. */
export function useLastWeight(): number | null | undefined {
  return useLiveQuery(async () => latestWeight(await db.weights.toArray())?.kg ?? null, []);
}
