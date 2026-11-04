import { addWeight } from "@/features/body/weight";
import { saveProfile, setOnboarded } from "@/features/profile/profile";
import { profilePatch, type OnboardingAnswers } from "./plan";

/** Fin de la Première ouverture : profil, première pesée du jour, puis marque « terminée ». */
export async function finishOnboarding(a: OnboardingAnswers, weightKg: number, today: string) {
  await saveProfile(profilePatch(a));
  await addWeight(today, weightKg);
  await setOnboarded();
}
