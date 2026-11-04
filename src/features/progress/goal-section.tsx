"use client";

import Link from "next/link";
import { Gauge } from "@/components/ui/gauge";
import { Label } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { RULES } from "@/config/rules";
import { arrivalDate, monthPart } from "@/features/goal/goal";
import { useT } from "@/i18n/use-t";
import { goalProgress } from "./chart";

/** Objectif : poids visé, ce qu'il reste, date estimée et jauge du chemin parcouru. */
export function GoalSection({
  goalKg,
  goalDate,
  avgKg,
  startKg,
  today,
}: {
  goalKg: number | undefined;
  goalDate: string | undefined;
  avgKg: number | null;
  startKg: number | null;
  today: string;
}) {
  const { t, n, locale } = useT();

  if (goalKg === undefined) {
    return (
      <section>
        <Label>{t("progress.goal")}</Label>
        <Row href="/moi/reglages/objectif/" label={t("progress.goal-set")} chevron />
      </section>
    );
  }

  const reached = avgKg !== null && avgKg <= goalKg;
  const eta = goalDate ?? (avgKg !== null && !reached ? arrivalDate(today, avgKg, goalKg, RULES.lossPctPerWeek.value) : null);
  const month = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    const opts: Intl.DateTimeFormatOptions = iso.slice(0, 4) === today.slice(0, 4) ? { month: "long" } : { month: "long", year: "numeric" };
    return new Intl.DateTimeFormat(locale, opts).format(new Date(y, m - 1, d));
  };
  const when = eta && !reached ? t("goal.eta", { when: t(`goal.part.${monthPart(eta)}`, { month: month(eta) }) }) : null;
  const share = avgKg !== null && startKg !== null ? goalProgress(startKg, avgKg, goalKg) : null;

  return (
    <section>
      <Label>{t("progress.goal")}</Label>
      <Link href="/moi/reglages/objectif/" className="mt-1.5 flex items-center gap-3 py-3.5">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="num text-moyen">{t("progress.goal-kg", { n: n(goalKg, 1) })}</span>
          <span className="text-petit text-texte-discret">
            {reached ? t("progress.goal-reached") : avgKg !== null ? t("progress.goal-left", { n: n(avgKg - goalKg, 1) }) : ""}
          </span>
        </span>
        {when && <span className="num shrink-0 text-right text-valeur text-texte-discret">{when}</span>}
      </Link>
      <div className="mt-1.5">
        <Gauge value={share ?? (reached ? 1 : 0)} max={1} tone="actif" />
      </div>
      <p className="num mt-2 text-valeur text-texte-discret">
        {t("progress.goal-pct", { n: n((share ?? (reached ? 1 : 0)) * 100) })}
      </p>
    </section>
  );
}
