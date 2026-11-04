"use client";

import { useState } from "react";
import { Label } from "@/components/ui/page";
import { ValueSheet } from "@/components/ui/value-sheet";
import { PROGRESS, type PeriodId } from "@/config/progress";
import { daysBetween } from "@/features/goal/goal";
import { useT } from "@/i18n/use-t";
import { buildChart, change, dailySamples, periodFrom } from "./chart";
import { dayName, recentDay, signed } from "./format";
import { Graph, type Mark } from "./graph";
import { addWaist } from "./waist";

export type WaistRow = { date: string; cm: number; updatedAt: number };

/** Tour de taille : dernière mesure, évolution, petite courbe, saisie dans un panneau. */
export function WaistSection({ waists, period, today }: { waists: WaistRow[]; period: PeriodId; today: string }) {
  const { t, n, locale } = useT();
  const [open, setOpen] = useState(false);

  const days = dailySamples(waists.map((w) => ({ date: w.date, value: w.cm, at: w.updatedAt })));
  const last = days.length ? days[days.length - 1] : null;
  const from = periodFrom(period, today, days.length ? days[0].date : null);
  const inPeriod = days.filter((d) => d.date >= from && d.date <= today);
  const model = buildChart(inPeriod, [], from, today, PROGRESS.waistChart.maxTicks);
  const evo = change(inPeriod);

  const marks = (w: number): Mark[] => {
    const weeks = Math.round(daysBetween(from, today) / 7);
    return [
      { x: PROGRESS.chartPad.left, text: t("progress.weeks-ago", { n: weeks }), align: "start" },
      { x: w - PROGRESS.chartPad.right, text: t("progress.this-week"), align: "end" },
    ];
  };

  return (
    <section>
      <Label>{t("progress.waist")}</Label>
      <div className="mt-1.5 flex items-baseline justify-between gap-3">
        <p className="num flex items-baseline gap-1.5">
          <span className="text-grand tracking-[-0.02em]">{last ? n(last.value, 1) : t("progress.none")}</span>
          <span className="text-valeur text-texte-discret">{t("progress.cm")}</span>
        </p>
        <button onClick={() => setOpen(true)} className="tap min-w-0 flex-1 text-left text-petit text-actif underline">
          {t("progress.measure")}
        </button>
      </div>

      <div className="mt-0.5 flex items-center justify-between gap-3 text-petit [overflow-wrap:anywhere]">
        {last ? (
          <>
            <p className="min-w-0 flex-1">
              {evo &&
                t(evo.weeks === 1 ? "progress.change-one" : "progress.change-other", {
                  delta: signed(n, evo.delta),
                  unit: t("progress.cm"),
                  n: evo.weeks,
                })}
            </p>
            <p className="shrink-0 text-texte-discret">{t("progress.measured", { when: recentDay(locale, last.date, today, PROGRESS.recentDays) })}</p>
          </>
        ) : (
          <p className="text-texte-discret">{t("progress.no-waist")}</p>
        )}
      </div>

      <div className="mt-3.5">
        <Graph
          model={model}
          shape={PROGRESS.waistChart}
          marks={marks}
          tickLabel={(v) => n(v, v % 1 ? 1 : 0)}
          label={t("progress.chart-waist")}
          linkDots
        />
      </div>

      <ValueSheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("progress.waist")}
        hint={t("progress.waist-hint")}
        note={last ? t("progress.waist-last", { value: n(last.value, 1), when: dayName(locale, last.date, true) }) : undefined}
        unit={t("progress.cm")}
        value={last?.value ?? PROGRESS.defaultWaistCm}
        min={PROGRESS.waistCm.min}
        max={PROGRESS.waistCm.max}
        saveLabel={t("progress.save")}
        onSave={(v) => addWaist(today, v)}
      />
    </section>
  );
}
