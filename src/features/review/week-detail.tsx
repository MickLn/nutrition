"use client";

import { Button } from "@/components/ui/button";
import { BackLink, Label, PageTitle } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { showToast } from "@/components/ui/toast";
import { useT } from "@/i18n/use-t";
import { toISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useWeekLabel } from "./labels";
import { withinTolerance, type WeekReview } from "./review";
import { answerWeek, useReview } from "./use-review";

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
  return <WeekView week={week} today={today} />;
}

function WeekView({ week, today }: { week: WeekReview | undefined; today: string }) {
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
            <Calories week={week} today={today} />
          </Section>
          <div className="h-10" />
        </>
      )}
    </div>
  );
}

function Calories({ week, today }: { week: WeekReview; today: string }) {
  const { t, n, locale } = useT();
  const { adjustment: adj, state } = week;
  const changed = adj.delta !== 0 && state !== "refused" && state !== "steady";
  const delta = n(Math.abs(adj.delta));

  const respond = async (status: "accepted" | "refused") => {
    try {
      await answerWeek(week, status, today);
      showToast(status === "accepted" ? t("review.accepted-toast", { n: n(adj.newKcal) }) : t("review.refused-toast", { n: n(week.kcalTarget) }));
    } catch {
      showToast(t("review.error"));
    }
  };

  if (changed) {
    const explanation =
      adj.reason === "stalled-3w"
        ? t("review.explain-plateau", { delta })
        : adj.reason === "too-fast"
          ? t("review.explain-fast", { delta })
          : t("adjust.floor", { kcal: n(adj.newKcal) });
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="num text-grand tracking-[-0.02em] text-texte-discret line-through">{n(week.kcalTarget)}</span>
          <span className="num text-valeur" aria-hidden>
            ›
          </span>
          <span className="num text-moyen text-actif">{n(adj.newKcal)}</span>
          <span className="num text-mono-petit text-texte-discret">{t("review.kcal-day")}</span>
        </div>
        <p className="text-petit">{explanation}</p>
        {state === "proposal" && (
          <div className="mt-4 flex flex-col items-stretch gap-1">
            <Button onClick={() => respond("accepted")}>{t("review.accept", { n: n(adj.newKcal) })}</Button>
            <Button variant="link" onClick={() => respond("refused")}>
              {t("review.refuse", { n: n(week.kcalTarget) })}
            </Button>
          </div>
        )}
        {state === "accepted" && <p className="text-petit text-texte-discret">{t("review.accepted-on", { date: dateLabel(week.record?.at, locale) })}</p>}
      </div>
    );
  }

  const kept = state === "refused" ? week.kcalTarget : adj.newKcal;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="num text-grand tracking-[-0.02em] text-actif">{n(kept)}</span>
        <span className="num text-mono-petit text-texte-discret">{t("review.kcal-day-same")}</span>
      </div>
      {state === "refused" && <p className="text-petit text-texte-discret">{t("review.refused-text", { n: n(week.kcalTarget) })}</p>}
      {state === "steady" && adj.reason !== "on-track" && <p className="text-petit text-texte-discret">{t(`adjust.${adj.reason}`, { kcal: n(adj.newKcal), delta })}</p>}
    </div>
  );
}

function dateLabel(iso: string | undefined, locale: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(new Date(y, m - 1, d));
}
