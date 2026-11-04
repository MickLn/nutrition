"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/page";
import { ValueSheet } from "@/components/ui/value-sheet";
import { PROGRESS, type PeriodId } from "@/config/progress";
import { UI } from "@/config/ui";
import { average7, weighInStatus, type WeighIn } from "@/engine/weight";
import { addWeight } from "@/features/body/weight";
import { daysBetween } from "@/features/goal/goal";
import { useT } from "@/i18n/use-t";
import { buildChart, change, dailySamples, monthStarts, periodFrom, spreadMarks, trendPoints } from "./chart";
import { dayName, monthShort, signed } from "./format";
import { Graph, type Mark } from "./graph";

/** Poids : moyenne 7 jours en grand, évolution, courbe (points + moyenne), état « sans pesée », saisie à la main. */
export function WeightSection({ weights, period, today }: { weights: WeighIn[]; period: PeriodId; today: string }) {
  const { t, n, locale } = useT();
  const [open, setOpen] = useState(false);

  const days = dailySamples(weights.map((w) => ({ date: w.date, value: w.kg, at: w.at })));
  const first = days.length ? days[0].date : null;
  const last = days.length ? days[days.length - 1] : null;
  const from = periodFrom(period, today, first);
  const trend = trendPoints(weights, from, today);
  const model = buildChart(days, trend, from, today, PROGRESS.weightChart.maxTicks);
  const status = weighInStatus(weights, today);
  const avg = average7(weights, today) ?? (last ? average7(weights, last.date) : null);
  const evo = change(trend);
  const sinceLast = last ? daysBetween(last.date, today) : null;

  const marks = (w: number): Mark[] => {
    const { left, right } = PROGRESS.chartPad;
    const span = Math.max(daysBetween(from, today), 1);
    const all = monthStarts(from, today).map((d) => ({ px: left + (daysBetween(from, d) / span) * (w - left - right), d }));
    return spreadMarks(all, PROGRESS.monthLabelGap).map((m) => ({ x: m.px, text: monthShort(locale, m.d) }));
  };

  return (
    <section>
      <Label>{t("progress.weight")}</Label>
      <button onClick={() => setOpen(true)} className="tap mt-1.5 flex items-baseline gap-2 text-left" aria-label={t("progress.note-weight")}>
        <span className="num text-grand tracking-[-0.02em]">{avg !== null ? n(avg, 1) : t("progress.none")}</span>
        <span className="num text-valeur text-texte-discret">{t("progress.kg")}</span>
      </button>

      <div className="mt-1 [overflow-wrap:anywhere]">
        {status !== "ok" && last && sinceLast !== null ? (
          <div className="flex flex-wrap items-center justify-between gap-x-3">
            <Alert>{status === "incomplete" ? t("progress.incomplete") : t("weight.late", { n: sinceLast })}</Alert>
            <p className="min-w-0 flex-1 text-petit text-texte-discret">{t("progress.last-weigh", { when: dayName(locale, last.date) })}</p>
          </div>
        ) : evo ? (
          <p className="text-petit">
            {t(evo.weeks === 1 ? "progress.change-one" : "progress.change-other", {
              delta: signed(n, evo.delta),
              unit: t("progress.kg"),
              n: evo.weeks,
            })}
          </p>
        ) : !last ? (
          <p className="text-petit text-texte-discret">{t("progress.no-weight")}</p>
        ) : null}
      </div>

      <div className="mt-[18px]">
        <Graph
          model={model}
          shape={PROGRESS.weightChart}
          marks={marks}
          tickLabel={(v) => n(v, v % 1 ? 1 : 0)}
          label={t("progress.chart-weight")}
          dashed={status !== "ok"}
        />
      </div>

      {status !== "ok" && (
        <Button variant="link" className="tap mt-2 !min-h-0 justify-start !px-0 text-petit" onClick={() => setOpen(true)}>
          {t("progress.weigh-me")}
        </Button>
      )}

      <ValueSheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("weight.title")}
        hint={t("progress.weight-hint")}
        note={last ? t("progress.weight-last", { value: n(last.value, 1), when: dayName(locale, last.date, true) }) : undefined}
        unit={t("progress.kg")}
        value={last?.value ?? PROGRESS.defaultWeightKg}
        min={UI.weightKg.min}
        max={UI.weightKg.max}
        saveLabel={t("progress.save")}
        onSave={(v) => addWeight(today, v)}
      />
    </section>
  );
}
