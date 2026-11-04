"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilterGroup } from "@/components/ui/filter";
import { PageTitle, SectionHead } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { Toggle } from "@/components/ui/toggle";
import { ValueSheet } from "@/components/ui/value-sheet";
import { ONBOARDING } from "@/config/onboarding";
import { DEFAULT_PROFILE, profileSchema, type Sex } from "@/config/profile";
import { RULES } from "@/config/rules";
import { UI } from "@/config/ui";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";
import { decimals, goalPreview, type OnboardingAnswers } from "./plan";

export const STEP_COUNT = 3;

/**
 * Cadre commun des 3 écrans : repère « 1 SUR 3 », contenu, puis bloc « Bas » collé en bas de l'écran
 * (Espace flexible du Figma). La barre du bas est masquée ici : on reprend la marge que le layout lui réserve.
 */
function StepFrame({ step, children, bottom }: { step: number; children: React.ReactNode; bottom: React.ReactNode }) {
  const { t } = useT();
  return (
    <div className="mb-[calc(-110px-env(safe-area-inset-bottom))] flex min-h-[calc(100dvh-max(env(safe-area-inset-top),24px))] flex-col">
      <p className="libelle">{t("onboarding.step", { n: step, total: STEP_COUNT })}</p>
      {children}
      <div className="flex-1" />
      <div className="flex flex-col gap-2.5 pb-[max(34px,env(safe-area-inset-bottom))] pt-6">{bottom}</div>
    </div>
  );
}

/** Étape 1 (Figma « Bienvenue »). */
export function WelcomeStep({ onNext }: { onNext: () => void }) {
  const { t } = useT();
  return (
    <StepFrame step={1} bottom={<Button onClick={onNext}>{t("onboarding.start")}</Button>}>
      <PageTitle className="mt-[130px]">{t("onboarding.welcome-title")}</PageTitle>
      <p className="mt-3.5 text-corps text-texte-discret">{t("onboarding.welcome-text")}</p>
    </StepFrame>
  );
}

type Field = "age" | "height" | "weight";

/** Étape 2 (Figma « Toi ») : sexe, âge, taille, poids, activité. */
export function YouStep({
  answers,
  setAnswers,
  weightKg,
  setWeightKg,
  onNext,
  onBack,
}: {
  answers: OnboardingAnswers;
  setAnswers: (a: OnboardingAnswers) => void;
  weightKg: number | null;
  setWeightKg: (kg: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { t, n } = useT();
  const [editing, setEditing] = useState<Field | null>(null);
  const age = profileSchema.shape.age;
  const height = profileSchema.shape.heightCm;
  const sheets = {
    age: { title: t("onboarding.age"), unit: t("onboarding.age-unit"), value: answers.age, min: age.minValue ?? 0, max: age.maxValue ?? Infinity, save: (v: number) => setAnswers({ ...answers, age: Math.round(v) }) },
    height: { title: t("onboarding.height"), unit: t("onboarding.height-unit"), value: answers.heightCm, min: height.minValue ?? 0, max: height.maxValue ?? Infinity, save: (v: number) => setAnswers({ ...answers, heightCm: v }) },
    weight: { title: t("onboarding.weight"), unit: t("onboarding.weight-unit"), value: weightKg ?? ONBOARDING.weightSheetStartKg, min: UI.weightKg.min, max: UI.weightKg.max, save: setWeightKg },
  };
  const sheet = sheets[editing ?? "age"];

  return (
    <StepFrame
      step={2}
      bottom={
        <>
          <Button onClick={onNext} disabled={weightKg === null}>
            {t("onboarding.next")}
          </Button>
          <Button variant="link" onClick={onBack} className="w-full">
            {t("onboarding.back")}
          </Button>
        </>
      }
    >
      <PageTitle className="mt-3.5">{t("onboarding.you-title")}</PageTitle>

      <div className="mt-3.5 flex items-center justify-between gap-3 border-b border-trait py-2.5">
        <span className="min-w-0 flex-1 text-corps">{t("onboarding.sex")}</span>
        <FilterGroup<Sex>
          label={t("onboarding.sex")}
          value={answers.sex}
          onChange={(sex) => setAnswers({ ...answers, sex })}
          options={[
            { value: "m", label: t("onboarding.sex-m") },
            { value: "f", label: t("onboarding.sex-f") },
          ]}
        />
      </div>
      <Row label={t("onboarding.age")} value={`${n(answers.age)} ${t("onboarding.age-unit")}`} chevron onClick={() => setEditing("age")} />
      <Row label={t("onboarding.height")} value={`${n(answers.heightCm)} ${t("onboarding.height-unit")}`} chevron onClick={() => setEditing("height")} />
      <Row
        label={t("onboarding.weight")}
        value={weightKg === null ? t("onboarding.empty") : `${n(weightKg, 1)} ${t("onboarding.weight-unit")}`}
        chevron
        onClick={() => setEditing("weight")}
      />

      <div className="mt-[26px]">
        <SectionHead>{t("onboarding.activity")}</SectionHead>
      </div>
      <div role="radiogroup" aria-label={t("onboarding.activity")} className="mt-2">
        {RULES.activityLevels.value.map((level, i) => (
          <Row
            key={level}
            dense
            checked={answers.activity === level}
            label={t(`onboarding.activity-${i}`)}
            value={t("onboarding.coef", { n: n(level, decimals(level)) })}
            onClick={() => setAnswers({ ...answers, activity: level })}
          />
        ))}
      </div>

      <ValueSheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={sheet.title}
        unit={sheet.unit}
        value={sheet.value}
        min={sheet.min}
        max={sheet.max}
        saveLabel={t("onboarding.save")}
        onSave={sheet.save}
      />
    </StepFrame>
  );
}

/** Étape 3 (Figma « Ton objectif ») : objectif calculé par le moteur, Musculation, répartition. */
export function GoalStep({
  answers,
  setAnswers,
  weightKg,
  busy,
  onFinish,
}: {
  answers: OnboardingAnswers;
  setAnswers: (a: OnboardingAnswers) => void;
  weightKg: number;
  busy: boolean;
  onFinish: () => void;
}) {
  const { t, n } = useT();
  const { profile, bmr, targets } = goalPreview(DEFAULT_PROFILE, answers, weightKg);
  const grams = (v: number) => `${n(v)} ${t("units.g")}`;

  return (
    <StepFrame
      step={3}
      bottom={
        <Button onClick={onFinish} disabled={busy}>
          {t("onboarding.finish")}
        </Button>
      }
    >
      <PageTitle className="mt-3.5">{t("onboarding.goal-title")}</PageTitle>

      <p className="num mt-2.5 flex flex-wrap items-baseline gap-x-2">
        <span className="text-heros tracking-[-0.04em]">{n(targets.kcal)}</span>
        <span className="text-valeur text-texte-discret">{t("onboarding.per-day")}</span>
      </p>

      <div className="mt-3 flex items-start">
        <Part value={n(bmr)} label={t("onboarding.at-rest")} />
        <Part value={t("onboarding.times", { n: n(profile.activity, decimals(profile.activity)) })} label={t("onboarding.activity-short")} divider />
        <Part
          value={t("onboarding.minus", { n: n(targets.deficit) })}
          label={t("onboarding.loss", { pct: n(RULES.lossPctPerWeek.value * 100, 1) })}
          divider
        />
      </div>
      {targets.floorApplied && <p className="mt-1 text-petit text-texte-discret">{t("onboarding.floor", { kcal: n(targets.kcal) })}</p>}

      <div className="mt-3.5 flex items-center justify-between gap-3 border-b border-trait py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-corps">{t("onboarding.strength")}</span>
          <span className="text-petit text-texte-discret">{t("onboarding.strength-detail", { n: n(profile.proteinGPerKg, 1) })}</span>
        </div>
        <Toggle label={t("onboarding.strength")} on={answers.strength} onChange={(strength) => setAnswers({ ...answers, strength })} />
      </div>

      <div className="mt-[26px]">
        <SectionHead>{t("onboarding.split")}</SectionHead>
      </div>
      <div className="mt-2">
        <Row label={t("onboarding.protein")} value={grams(targets.protein)} />
        <Row label={t("onboarding.fat")} value={grams(targets.fat)} />
        <Row label={t("onboarding.carbs")} value={grams(targets.carbs)} />
      </div>
    </StepFrame>
  );
}

/** Une colonne du « Détail du calcul » : chiffre moyen, libellé petit ; trait vertical à gauche sauf la première. */
function Part({ value, label, divider }: { value: string; label: string; divider?: boolean }) {
  return (
    // box-content : les trois colonnes gardent la même largeur de texte, le trait et la marge s'ajoutent (comme au Figma).
    <div className={cn("box-content flex min-w-0 flex-1 flex-col gap-0.5 py-3", divider && "border-l border-trait pl-3.5")}>
      <span className="num whitespace-nowrap text-moyen">{value}</span>
      <span className="text-petit text-texte-discret">{label}</span>
    </div>
  );
}
