import { STRENGTH_DEFAULTS, type ActivityLevel, type Profile, type Sex } from "@/config/profile";
import { bmr, startTargets, type Targets } from "@/engine/targets";

/** Ce que la Première ouverture fait choisir (étape « Toi » + interrupteur Musculation). */
export type OnboardingAnswers = {
  sex: Sex;
  age: number;
  heightCm: number;
  activity: ActivityLevel;
  strength: boolean;
};

/** Partie du profil à enregistrer : les réponses + les défauts protéines / lipides liés à Musculation. */
export function profilePatch(a: OnboardingAnswers): Partial<Profile> {
  return { ...a, ...STRENGTH_DEFAULTS[a.strength ? "on" : "off"] };
}

export type GoalPreview = {
  /** Profil tel qu'il sera enregistré. */
  profile: Profile;
  /** Métabolisme de base (« au repos »). */
  bmr: number;
  targets: Targets;
};

/** Chiffres de l'écran « Ton objectif », tous tirés du moteur. */
export function goalPreview(base: Profile, a: OnboardingAnswers, weightKg: number): GoalPreview {
  const profile: Profile = { ...base, ...profilePatch(a) };
  return { profile, bmr: bmr(profile, weightKg), targets: startTargets(profile, weightKg) };
}

/** Nombre de décimales à afficher pour un coefficient (1,2 → 1 ; 1,375 → 3). */
export function decimals(v: number): number {
  return String(v).split(".")[1]?.length ?? 0;
}
