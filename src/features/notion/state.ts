import { db } from "@/lib/db";
import type { SyncMap } from "./sync";

/** Réglages de la copie vers Notion, rangés dans la table `settings` (une clé chacun, pour ne rien écraser). */
export const KEYS = {
  secret: "notion.secret",
  auto: "notion.auto",
  lastSuccess: "notion.lastSuccess",
  failingSince: "notion.failingSince",
  error: "notion.error",
  map: "notion.map",
} as const;

/** Raison de l'échec affichée dans l'écran. */
export type NotionError = "code" | "config" | "server" | "network";

const get = async <T>(key: string): Promise<T | null> => ((await db.settings.get(key))?.value as T | undefined) ?? null;
const set = (key: string, value: unknown) => db.settings.put({ key, value });
const del = (key: string) => db.settings.delete(key);

export const getSecret = () => get<string>(KEYS.secret);
export const getAuto = async () => (await get<boolean>(KEYS.auto)) ?? true;
export const getMap = async () => (await get<SyncMap>(KEYS.map)) ?? {};
export const getFailingSince = () => get<number>(KEYS.failingSince);

export const setMap = (map: SyncMap) => set(KEYS.map, map);
export const setAuto = (on: boolean) => set(KEYS.auto, on);

export async function saveSecret(code: string) {
  await db.transaction("rw", db.settings, async () => {
    await set(KEYS.secret, code.trim());
    await del(KEYS.error);
    await del(KEYS.failingSince);
    await del(KEYS.map);
  });
}

export async function markSuccess(now = Date.now()) {
  await db.transaction("rw", db.settings, async () => {
    await set(KEYS.lastSuccess, now);
    await del(KEYS.failingSince);
    await del(KEYS.error);
  });
}

export async function markFailure(error: NotionError, now = Date.now()) {
  await db.transaction("rw", db.settings, async () => {
    if ((await get<number>(KEYS.failingSince)) === null) await set(KEYS.failingSince, now);
    await set(KEYS.error, error);
  });
}

/** Efface le code et la carte dans l'app. Notion n'est pas touché. */
export async function disconnect() {
  await db.settings.bulkDelete(Object.values(KEYS).filter((k) => k !== KEYS.auto));
}
