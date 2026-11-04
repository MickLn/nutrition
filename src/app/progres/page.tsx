"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { FilterGroup } from "@/components/ui/filter";
import { PageTitle } from "@/components/ui/page";
import { PROGRESS, type PeriodId } from "@/config/progress";
import { average7 } from "@/engine/weight";
import { WeeklyReview } from "@/features/review/weekly-review";
import { useProfile } from "@/features/profile/profile";
import { GoalSection } from "@/features/progress/goal-section";
import { WaistSection } from "@/features/progress/waist-section";
import { WeightSection } from "@/features/progress/weight-section";
import { useT } from "@/i18n/use-t";
import { addDays, toISODate } from "@/lib/dates";
import { db } from "@/lib/db";

/** Progrès (Figma 10:644) : courbe du poids, tour de taille, objectif, bilans. */
export default function ProgressPage() {
  const { t } = useT();
  const today = toISODate(new Date());
  const [period, setPeriod] = useState<PeriodId>(PROGRESS.defaultPeriod);
  const profile = useProfile();
  const rows = useLiveQuery(() => db.weights.toArray(), []);
  const waistRows = useLiveQuery(() => db.waists.toArray(), []);
  if (!rows || !waistRows) return null;

  const weights = rows.map((w) => ({ date: w.date, kg: w.kg, at: w.updatedAt }));
  const waists = waistRows.map((w) => ({ date: w.date, cm: w.cm, updatedAt: w.updatedAt }));
  const dates = weights.map((w) => w.date).sort();
  const avgKg = average7(weights, today) ?? (dates.length ? average7(weights, dates[dates.length - 1]) : null);
  // Départ = moyenne des 7 premiers jours de pesées (pas une seule pesée, trop variable).
  const startKg = dates.length ? average7(weights, addDays(dates[0], 6)) : null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <PageTitle>{t("progress.title")}</PageTitle>
        <FilterGroup
          label={t("progress.period")}
          value={period}
          onChange={setPeriod}
          options={PROGRESS.periods.map((p) => ({ value: p.id, label: t(`progress.period-${p.id}`) }))}
        />
      </div>

      <div className="mt-[18px]">
        <WeightSection weights={weights} period={period} today={today} />
      </div>
      <div className="mt-[46px]">
        <WaistSection waists={waists} period={period} today={today} />
      </div>
      <div className="mt-[46px]">
        <GoalSection goalKg={profile?.goalKg} goalDate={profile?.goalDate} avgKg={avgKg} startKg={startKg} today={today} />
      </div>
      <div className="mt-[46px]">
        <WeeklyReview />
      </div>
    </div>
  );
}
