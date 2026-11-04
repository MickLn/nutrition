import { profileSchema, STRENGTH_DEFAULTS, type Profile } from "@/config/profile";

/** Logique pure de la page Profil (brouillon local avant « Enregistrer »). */

type NumberKey = "age" | "heightCm" | "proteinGPerKg" | "fatPct" | "fiberG" | "waterL" | "goalKg";

/** Bornes d'un champ chiffré, lues dans profileSchema (une seule source pour la saisie et la validation). */
export function profileBounds(key: NumberKey): { min: number; max: number } {
  let field = profileSchema.shape[key] as unknown as { minValue?: number | null; maxValue?: number | null; unwrap?: () => unknown };
  if (field.unwrap) field = field.unwrap() as typeof field;
  return { min: field.minValue ?? 0, max: field.maxValue ?? Number.MAX_SAFE_INTEGER };
}

/** Basculer Musculation remet les protéines et lipides conseillés (comme saveProfile). */
export function withStrength(p: Profile, on: boolean): Profile {
  return on === p.strength ? p : { ...p, strength: on, ...STRENGTH_DEFAULTS[on ? "on" : "off"] };
}

/** Dernière pesée : date la plus récente, puis la saisie la plus récente du jour. */
export function latestWeight<W extends { date: string; kg: number; updatedAt: number }>(rows: W[]): W | null {
  let last: W | null = null;
  for (const w of rows) if (!last || w.date > last.date || (w.date === last.date && w.updatedAt > last.updatedAt)) last = w;
  return last;
}

/** Nombre de décimales d'un coefficient (1,2 → 1 ; 1,375 → 3), pour l'afficher sans l'arrondir. */
export function decimals(v: number): number {
  return String(v).split(".")[1]?.length ?? 0;
}
