"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { CALENDAR } from "@/config/calendar";
import { useT } from "@/i18n/use-t";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { monthGrid, monthOf, monthRange, shiftMonth, type Month } from "./month";

/**
 * Calendrier du mois (Figma « Calendrier, tap sur la date ») : panneau du bas, un point sous les jours
 * où il y a des saisies, le jour affiché en bleu léger. Les jours à venir ne se choisissent pas.
 */
export function CalendarSheet({ open, date, today, onPick, onClose }: { open: boolean; date: string; today: string; onPick: (d: string) => void; onClose: () => void }) {
  const { t } = useT();
  return (
    <Sheet open={open} onClose={onClose} label={t("calendar.label")}>
      {/* Le contenu est recréé à chaque ouverture : il repart toujours du mois du jour affiché. */}
      <MonthView date={date} today={today} onPick={onPick} />
    </Sheet>
  );
}

function MonthView({ date, today, onPick }: { date: string; today: string; onPick: (d: string) => void }) {
  const { t, locale } = useT();
  const [month, setMonth] = useState<Month>(() => monthOf(date));
  const [from, to] = monthRange(month);
  const logged = useLiveQuery(async () => new Set((await db.logEntries.where("date").between(from, to, true, true).toArray()).map((e) => e.date)), [from, to]);

  const title = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(month.year, month.month - 1, 1));
  const weekdays = useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
    // 2024-01-01 est un lundi.
    return Array.from({ length: 7 }, (_, i) => f.format(new Date(2024, 0, 1 + ((CALENDAR.weekStartsOn + i + 6) % 7))));
  }, [locale]);
  const dayLabel = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" });
  const canNext = monthRange(shiftMonth(month, 1))[0] <= today;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-section font-medium capitalize">{title}</h2>
        <div className="flex text-corps">
          <button className="tap flex size-11 items-center justify-center" aria-label={t("calendar.prev-month")} onClick={() => setMonth(shiftMonth(month, -1))}>
            ‹
          </button>
          {canNext && (
            <button className="tap flex size-11 items-center justify-center" aria-label={t("calendar.next-month")} onClick={() => setMonth(shiftMonth(month, 1))}>
              ›
            </button>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-1">
        <div className="flex justify-between" aria-hidden>
          {weekdays.map((w, i) => (
            <span key={i} className="libelle flex h-6 w-11 items-center justify-center !tracking-normal">
              {w}
            </span>
          ))}
        </div>
        {monthGrid(month).map((week, w) => (
          <div key={w} className="flex justify-between">
            {week.map((d, i) => {
              if (!d) return <span key={i} className="size-11" />;
              const future = d > today;
              const has = logged?.has(d) ?? false;
              const [y, m, day] = d.split("-").map(Number);
              return (
                <button
                  key={i}
                  disabled={future}
                  onClick={() => onPick(d)}
                  aria-current={d === date ? "date" : undefined}
                  aria-label={has ? t("calendar.has-entries", { date: dayLabel.format(new Date(y, m - 1, day)) }) : dayLabel.format(new Date(y, m - 1, day))}
                  className={cn(
                    "num flex size-11 flex-col items-center justify-center gap-[3px] rounded-base text-valeur",
                    d === date ? "bg-actif-leger text-actif" : future || !has ? "text-texte-discret" : "text-texte",
                  )}
                >
                  {day}
                  <span className={cn("size-1 rounded-full", has ? "bg-actif" : "bg-transparent")} aria-hidden />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
