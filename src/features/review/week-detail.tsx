"use client";

import { BackLink, Label, PageTitle } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { useT } from "@/i18n/use-t";
import { toISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useWeekLabel } from "./labels";
import { withinTolerance, type WeekReview } from "./review";
import { useReview } from "./use-review";

type Fmt = ReturnType<typeof useT>["n"];

/** Valeur à droite d'une ligne : chiffre mono et, dessous, une précision (Outfit ou mono). */
function Two({ top, sub, accent, mono }: { top: React.ReactNode; sub?: React.ReactNode; accent?: boolean; mono?: boolean }) {
  return (
    <span className="flex flex-col items-end gap-0.5">
      <span className={cn("text-texte", accent && "text-actif")}>{top}</span>
      {sub && <span className={cn(!mono && "font-sans text-petit")}>{sub}</span>}
    </span>
  );
}

const signed = (n: Fmt, v: number, digits: number) => {
  const s = n(Math.abs(v), digits);
  return v < 0 && Number(s.replace(",", ".")) !== 0 ? `−${s}` : v > 0 && Number(s.replace(",", ".")) !== 0 ? `+${s}` : s;
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-[52px] first-of-type:mt-[18px]">
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

/** Détail d'un bilan (Figma 10:813 « la moyenne baisse », 10:876 « plateau de 3 semaines »). */
export function WeekDetail({ start, today = toISODate(new Date()) }: { start?: string | null; today?: string }) {
  const review = useReview(today);
  if (!review) return null;
  const week = start ? review.weeks.find((w) => w.start === start) : review.weeks[0];
  return <WeekView week={week} />;
}

function WeekView({ week }: { week: WeekReview | undefined }) {
  const { t, n } = useT();
  const weekLabel = useWeekLabel();

  return (
    <div>
      <BackLink href="/progres/">{t("review.back")}</BackLink>
      {!week ? (
        <p className="mt-3.5 text-corps text-texte-discret">{t("review.not-found")}</p>
      ) : (
        <>
          <PageTitle className="mt-3.5">{weekLabel(week.start)}</PageTitle>
          <Label className="mt-1.5">{t("review.label")}</Label>

          {!week.plateau && (
            <Section label={t("review.eaten")}>
              <Row
                dense
                label={t("review.kcal")}
                detail={t("review.per-day")}
                value={
                  <Two
                    top={week.avgKcal === null ? "—" : n(week.avgKcal)}
                    sub={
                      t("review.goal", { n: n(week.kcalTarget) }) +
                      (week.avgKcal !== null && withinTolerance(week.avgKcal, week.kcalTarget) ? `, ${t("review.within-tolerance")}` : "")
                    }
                  />
                }
              />
              <Row
                dense
                label={t("review.protein")}
                detail={t("review.per-day")}
                value={
                  <Two
                    accent
                    top={week.avgProtein === null ? "—" : t("review.grams", { n: n(week.avgProtein) })}
                    sub={t("review.goal", { n: t("review.grams", { n: n(week.proteinTarget) }) })}
                  />
                }
              />
              <Row dense label={t("review.protein-days")} value={<Two top={`${week.proteinDays}/7`} />} />
              <Row dense label={t("review.water")} value={<Two top={`${week.waterDays}/7`} sub={t("review.days")} />} />
            </Section>
          )}

          <Section label={t("review.body")}>
            <Row
              dense
              label={t("review.weight")}
              detail={t("review.avg7")}
              value={
                <Two
                  mono={!week.plateau}
                  top={week.weightKg === null ? "—" : t("review.kg", { n: n(week.weightKg, 1) })}
                  sub={
                    week.plateau
                      ? t("review.stable-3w")
                      : week.weightDelta === null
                        ? undefined
                        : t("review.kg", { n: signed(n, week.weightDelta, 1) })
                  }
                />
              }
            />
            <Row
              dense
              label={t("review.waist")}
              value={
                <Two
                  mono
                  top={week.waistCm === null ? "—" : t("review.cm", { n: n(week.waistCm, 1) })}
                  sub={week.waistDelta === null ? undefined : t("review.cm", { n: signed(n, week.waistDelta, 1) })}
                />
              }
            />
          </Section>

          <Section label={t("review.calories")}>
            <Calories week={week} />
          </Section>
          <div className="h-10" />
        </>
      )}
    </div>
  );
}

function Calories({ week }: { week: WeekReview }) {
  const { t, n } = useT();
  const delta = n(Math.abs(week.kcalAfter - week.kcalTarget));

  if (week.changed) {
    const explanation =
      week.reason === "stalled-3w"
        ? t("review.explain-plateau", { delta })
        : week.reason === "too-fast"
          ? t("review.explain-fast", { delta })
          : t("adjust.floor", { kcal: n(week.kcalAfter) });
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="num text-grand tracking-[-0.02em] text-texte-discret line-through">{n(week.kcalTarget)}</span>
          <span className="num text-valeur" aria-hidden>
            ›
          </span>
          <span className="num text-moyen text-actif">{n(week.kcalAfter)}</span>
          <span className="num text-mono-petit text-texte-discret">{t("review.kcal-day")}</span>
        </div>
        <p className="text-petit">{explanation}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="num text-grand tracking-[-0.02em] text-actif">{n(week.kcalAfter)}</span>
        <span className="num text-mono-petit text-texte-discret">{t("review.kcal-day-same")}</span>
      </div>
      {week.reason !== "on-track" && <p className="text-petit text-texte-discret">{t(`adjust.${week.reason}`, { kcal: n(week.kcalAfter), delta })}</p>}
    </div>
  );
}
