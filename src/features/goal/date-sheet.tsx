"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";
import { monthGrid } from "./goal";

const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Panneau « choisir la date » (Figma 91:2686) : un mois, lundi en premier, jours passés inactifs. */
export function DateSheet({
  open,
  onClose,
  initial,
  min,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  /** Date proposée à l'ouverture (AAAA-MM-JJ). */
  initial: string;
  /** Premier jour qu'on peut choisir. */
  min: string;
  onPick: (iso: string) => void;
}) {
  const { t } = useT();
  return (
    <Sheet open={open} onClose={onClose} label={t("goal.when-date")}>
      <DateForm
        key={initial}
        initial={initial < min ? min : initial}
        min={min}
        onPick={(d) => {
          onPick(d);
          onClose();
        }}
      />
    </Sheet>
  );
}

function DateForm({ initial, min, onPick }: { initial: string; min: string; onPick: (iso: string) => void }) {
  const { t, locale } = useT();
  const [picked, setPicked] = useState(initial);
  const [month, setMonth] = useState(() => ({ y: Number(initial.slice(0, 4)), m: Number(initial.slice(5, 7)) }));
  const first = new Date(month.y, month.m - 1, 1);
  const canPrev = `${month.y}-${String(month.m).padStart(2, "0")}` > min.slice(0, 7);
  const go = (d: number) => {
    const next = new Date(month.y, month.m - 1 + d, 1);
    setMonth({ y: next.getFullYear(), m: next.getMonth() + 1 });
  };
  const title = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(first);
  // Lettres des jours, du lundi au dimanche (5 janvier 2026 est un lundi).
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(new Date(2026, 0, 5 + i)));
  const label = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(parse(picked));

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="min-w-0 flex-1 text-section font-medium first-letter:uppercase">{title}</h2>
        <div className="flex gap-6 text-corps">
          <button className="tap disabled:opacity-0" disabled={!canPrev} aria-label={t("goal.prev-month")} onClick={() => go(-1)}>
            ‹
          </button>
          <button className="tap" aria-label={t("goal.next-month")} onClick={() => go(1)}>
            ›
          </button>
        </div>
      </div>
      <div role="grid" aria-label={title} className="mt-4 flex flex-col gap-1">
        <div role="row" className="flex justify-between">
          {weekdays.map((w, i) => (
            <span key={i} role="columnheader" className="libelle flex h-6 w-11 items-center justify-center">
              {w}
            </span>
          ))}
        </div>
        {monthGrid(month.y, month.m).map((week, i) => (
          <div key={i} role="row" className="flex justify-between">
            {week.map((d, j) =>
              d ? (
                <button
                  key={d}
                  role="gridcell"
                  aria-selected={d === picked}
                  disabled={d < min}
                  onClick={() => setPicked(d)}
                  className={cn(
                    "num flex size-11 items-center justify-center rounded-base text-valeur disabled:text-texte-discret disabled:opacity-50",
                    d === picked ? "bg-actif-leger text-actif" : "text-texte",
                  )}
                >
                  {Number(d.slice(8))}
                </button>
              ) : (
                <span key={j} className="size-11" aria-hidden />
              ),
            )}
          </div>
        ))}
      </div>
      <Button className="mt-4" onClick={() => onPick(picked)}>
        {t("goal.pick", { date: label })}
      </Button>
    </div>
  );
}
