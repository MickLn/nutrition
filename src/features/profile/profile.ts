"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { DEFAULT_PROFILE, profileSchema, STRENGTH_DEFAULTS, type Profile } from "@/config/profile";
import { db } from "@/lib/db";

/** Réglage où est rangé le profil (Moi › Profil, Première ouverture). */
export const PROFILE_KEY = "profile";
/** Réglage posé à la fin de la Première ouverture. */
export const ONBOARDED_KEY = "onboarded";

export function parseProfile(v: unknown): Profile {
  const parsed = profileSchema.safeParse(v);
  return parsed.success ? (parsed.data as Profile) : DEFAULT_PROFILE;
}

export async function loadProfile(): Promise<Profile> {
  return parseProfile((await db.settings.get(PROFILE_KEY))?.value);
}

/** Enregistre une partie du profil. Basculer Musculation remet les défauts protéines / lipides liés. */
export async function saveProfile(patch: Partial<Profile>): Promise<Profile> {
  const current = await loadProfile();
  const strengthChanged = patch.strength !== undefined && patch.strength !== current.strength;
  const next = { ...current, ...(strengthChanged ? STRENGTH_DEFAULTS[patch.strength ? "on" : "off"] : {}), ...patch };
  await db.settings.put({ key: PROFILE_KEY, value: next });
  return next;
}

export function useProfile(): Profile | undefined {
  return useLiveQuery(async () => loadProfile(), []);
}

export async function setOnboarded() {
  await db.settings.put({ key: ONBOARDED_KEY, value: Date.now() });
}

/** Faut-il montrer la Première ouverture ? Oui si jamais terminée et aucune donnée (un ancien utilisateur n'y est pas renvoyé). */
export async function needsOnboarding(): Promise<boolean> {
  if (await db.settings.get(ONBOARDED_KEY)) return false;
  return (await db.logEntries.count()) === 0 && (await db.weights.count()) === 0;
}
