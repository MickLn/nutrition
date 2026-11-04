"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Label } from "@/components/ui/page";
import { useBricks } from "@/bricks/use-bricks";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";
import { loadWeek } from "./stats";

/** Bloc « Cette semaine » de Moi : jours avec l'objectif de protéines atteint, moyenne des calories, jours d'eau. */
export function WeekBlock({ today }: { today: string }) {
  const { t, n } = useT();
  const on = useBricks();
  const week = useLiveQuery(() => loadWeek(today), [today]);
  const initials = t("me.days").split(" ");

  return (
    <section>
      <Label>{t("me.week")}</Label>
      {week && !week.hasData && <p className="mt-1.5 text-corps text-texte-discret">{t("me.week-empty")}</p>}
      {week?.hasData && (
        <>
          {week.hasGoal ? (
            <>
              <div className="mt-1.5 flex items-end gap-3">
                <p className="num flex shrink-0 items-baseline gap-1 whitespace-nowrap">
                  <span className="text-grand tracking-[-0.02em]">{n(week.reached)}</span>
                  <span className="text-moyen text-texte-discret">/{n(week.days.length)}</span>
                </p>
                <p className="min-w-0 flex-1 text-corps text-texte-discret [overflow-wrap:anywhere]">{t("me.protein-days")}</p>
              </div>
              <ol className="mt-3.5 flex gap-1.5" aria-hidden>
                {week.days.map((d, i) => (
                  <li key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <span className={cn("h-1.5 w-full rounded-[3px]", d.state === "reached" ? "bg-actif" : "bg-piste")} />
                    <span className="libelle">{initials[i]}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="mt-1.5 text-corps text-texte-discret">{t("me.no-goal")}</p>
          )}
          <div className="mt-3.5 flex items-start justify-between gap-3 text-petit">
            <p className="min-w-0 flex-1">{week.kcalAvg !== null && t("me.kcal-avg", { kcal: n(week.kcalAvg) })}</p>
            {on("water") && (
              <p className="shrink-0 whitespace-nowrap">{t("me.water-days", { n: n(week.waterDays), total: n(week.days.length) })}</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
