import { z } from "zod";
import { GOAL } from "./goal";
import { RULES } from "./rules";
import { UI } from "./ui";

export type AdjustCap = (typeof RULES.adjustCaps.value)[number];

/**
 * Profil de l'utilisateur. Les valeurs de MickLn sont des défauts, jamais lues par le moteur directement.
 * Les bornes servent aussi aux panneaux de saisie (Profil, Objectif). Les champs d'objectif sont facultatifs :
 * un profil enregistré avant leur ajout reste valide.
 */
export const profileSchema = z.object({
  sex: z.enum(["m", "f"]),
  age: z.number().int().min(15).max(100),
  heightCm: z.number().min(120).max(230),
  activity: z.number().refine((v) => (RULES.activityLevels.value as readonly number[]).includes(v)),
  /** Bornes larges : hors de RULES.proteinRange, la page Objectif avertit sans bloquer (decisions.md, chiffre changé à la main). */
  proteinGPerKg: z.number().min(GOAL.proteinInput.value.min).max(GOAL.proteinInput.value.max),
  fatPct: z.number().min(0.15).max(0.4),
  fiberG: z.number().min(0).max(100),
  waterL: z.number().min(0).max(10),
  strength: z.boolean(),
  /** Poids visé, en kg. Sert à estimer la date d'arrivée, pas les calories. */
  goalKg: z.number().min(UI.weightKg.min).max(UI.weightKg.max).optional(),
  /** Date choisie (« Quand : Ma date »), AAAA-MM-JJ. Absente = « Aucun ». */
  goalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  /** Ajustement max de l'objectif de calories, en kcal par semaine. Absent = GOAL.defaultAdjustCap. */
  adjustCapKcal: z.number().refine((v) => (RULES.adjustCaps.value as readonly number[]).includes(v)).optional(),
});

export type Sex = "m" | "f";
export type ActivityLevel = (typeof RULES.activityLevels.value)[number];
export type Profile = Omit<z.infer<typeof profileSchema>, "activity" | "adjustCapKcal"> & { activity: ActivityLevel; adjustCapKcal?: AdjustCap };

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
