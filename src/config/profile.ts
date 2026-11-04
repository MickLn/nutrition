import { z } from "zod";
import { RULES } from "./rules";

/** Profil de l'utilisateur. Les valeurs de MickLn sont des défauts, jamais lues par le moteur directement. */
export const profileSchema = z.object({
  sex: z.enum(["m", "f"]),
  age: z.number().int().min(15).max(100),
  heightCm: z.number().min(120).max(230),
  activity: z.number().refine((v) => (RULES.activityLevels.value as readonly number[]).includes(v)),
  proteinGPerKg: z.number().min(RULES.proteinRange.value.min).max(RULES.proteinRange.value.max),
  fatPct: z.number().min(0.15).max(0.4),
  fiberG: z.number().min(0),
  waterL: z.number().min(0),
  strength: z.boolean(),
});

export type Sex = "m" | "f";
export type ActivityLevel = (typeof RULES.activityLevels.value)[number];
export type Profile = Omit<z.infer<typeof profileSchema>, "activity"> & { activity: ActivityLevel };

/** Défauts selon l'interrupteur Musculation (decisions.md). */
export const STRENGTH_DEFAULTS = {
  on: { proteinGPerKg: 2.0, fatPct: 0.25 },
  off: { proteinGPerKg: 1.6, fatPct: 0.35 },
} as const;

export const DEFAULT_PROFILE: Profile = {
  sex: "m",
  age: 30,
  heightCm: 178,
  activity: 1.55,
  strength: true,
  ...STRENGTH_DEFAULTS.on,
  fiberG: 30,
  waterL: 1.5,
};
