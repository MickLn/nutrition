"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { isOn } from "./registry";
import type { BrickId } from "./types";

/** Réglage où sont rangés les interrupteurs des briques. */
export const BRICKS_KEY = "bricks";

/** Renvoie une fonction « cette brique est-elle allumée ? ». */
export function useBricks() {
  const overrides = useLiveQuery(() => db.settings.get(BRICKS_KEY), [])?.value as Partial<Record<BrickId, boolean>> | undefined;
  return (id: BrickId) => isOn(id, overrides ?? {});
}
