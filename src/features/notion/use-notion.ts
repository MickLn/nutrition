"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { NOTION } from "@/config/notion";
import { useSetting } from "@/features/settings/settings";
import { computeOutgoing } from "./library";
import { getFailingSince, KEYS, type NotionError } from "./state";
import { isLate } from "./sync";

/** « L'échec dure » : sert à la ligne discrète de l'écran Réglages. */
export function useNotionLate(): boolean {
  return useLiveQuery(async () => isLate(await getFailingSince(), Date.now(), NOTION.staleAfterDays), []) ?? false;
}

/** État de la copie vers Notion, suivi en direct (undefined pendant la lecture). */
export function useNotion() {
  const secret = useSetting<string>(KEYS.secret);
  const auto = useSetting<boolean>(KEYS.auto);
  const lastSuccess = useSetting<number>(KEYS.lastSuccess);
  const error = useSetting<NotionError>(KEYS.error);
  // Relu quand le code, la carte ou la bibliothèque changent.
  const pending = useLiveQuery(async () => (await computeOutgoing()).length, [secret]);
  return {
    loading: secret === undefined,
    connected: !!secret,
    auto: auto !== false,
    lastSuccess,
    error,
    pending,
    late: useNotionLate(),
  };
}
