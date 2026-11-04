"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "@/components/ui/toast";
import { DEFAULT_PROFILE } from "@/config/profile";
import { finishOnboarding } from "@/features/onboarding/finish";
import type { OnboardingAnswers } from "@/features/onboarding/plan";
import { GoalStep, WelcomeStep, YouStep } from "@/features/onboarding/steps";
import { useT } from "@/i18n/use-t";
import { toISODate } from "@/lib/dates";

/** Première ouverture : Bienvenue, Toi, Ton objectif. Trois étapes dans la même page (état local). */
export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useT();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<OnboardingAnswers>(() => {
    const { sex, age, heightCm, activity, strength } = DEFAULT_PROFILE;
    return { sex, age, heightCm, activity, strength };
  });
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const go = (s: number) => {
    setStep(s);
    window.scrollTo(0, 0);
  };

  if (step === 1) return <WelcomeStep onNext={() => go(2)} />;
  if (step === 2 || weightKg === null)
    return <YouStep answers={answers} setAnswers={setAnswers} weightKg={weightKg} setWeightKg={setWeightKg} onNext={() => go(3)} onBack={() => go(1)} />;
  return (
    <GoalStep
      answers={answers}
      setAnswers={setAnswers}
      weightKg={weightKg}
      busy={busy}
      onFinish={async () => {
        setBusy(true);
        try {
          await finishOnboarding(answers, weightKg, toISODate(new Date()));
          router.replace("/");
        } catch {
          setBusy(false);
          showToast(t("onboarding.error"));
        }
      }}
    />
  );
}
