"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BackupReminder } from "@/components/backup-reminder";
import { CalorieRing } from "@/components/calorie-ring";
import { MacroBar } from "@/components/macro-bar";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { addDays, dayLabel, toISODate } from "@/lib/dates";
import { db, type LogEntry, type Meal } from "@/lib/db";
import { entryMacros, GOALS_KEY, sumMacros, type Goals } from "@/lib/nutrition";

const MEALS: { id: Meal; label: string }[] = [
  { id: "breakfast", label: "Petit-déjeuner" },
  { id: "lunch", label: "Déjeuner" },
  { id: "dinner", label: "Dîner" },
  { id: "snack", label: "Collation" },
];

export default function JournalPage() {
  const [date, setDate] = useState(() => toISODate(new Date()));
  const entries = useLiveQuery(() => db.logEntries.where("date").equals(date).toArray(), [date]) ?? [];
  const goals = useLiveQuery(() => db.settings.get(GOALS_KEY), [])?.value as Goals | undefined;
  const total = sumMacros(entries);

  return (
    <>
      <PageHeader title={dayLabel(date)} subtitle="Journal">
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label="Jour précédent" onClick={() => setDate(addDays(date, -1))}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Jour suivant" onClick={() => setDate(addDays(date, 1))}>
            <ChevronRight />
          </Button>
        </div>
      </PageHeader>

      <div className="space-y-3">
        <BackupReminder />

        <Card className="flex items-center gap-5">
          <CalorieRing value={total.kcal} goal={goals?.kcal ?? null} />
          <div className="flex-1 space-y-3">
            <MacroBar label="Protéines" value={total.protein} goal={goals?.protein ?? null} color="var(--chart-protein)" />
            <MacroBar label="Glucides" value={total.carbs} goal={goals?.carbs ?? null} color="var(--chart-carbs)" />
            <MacroBar label="Lipides" value={total.fat} goal={goals?.fat ?? null} color="var(--chart-fat)" />
          </div>
        </Card>
        {!goals && (
          <p className="px-1 text-sm text-muted">
            Objectifs pas encore définis. Le calculateur arrive avec la phase 8.
          </p>
        )}

        {MEALS.map((meal) => (
          <MealCard key={meal.id} label={meal.label} entries={entries.filter((e) => e.meal === meal.id)} />
        ))}
      </div>
    </>
  );
}

function MealCard({ label, entries }: { label: string; entries: LogEntry[] }) {
  const kcal = sumMacros(entries).kcal;
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between py-2 pl-4 pr-2">
        <div>
          <h2 className="text-[15px] font-semibold">{label}</h2>
          <p className="num text-xs text-muted">{Math.round(kcal)} kcal</p>
        </div>
        <Link
          href="/ajouter/"
          aria-label={`Ajouter au ${label.toLowerCase()}`}
          className="grid size-11 place-items-center rounded-full text-blue transition-transform active:scale-95"
        >
          <Plus className="size-5" />
        </Link>
      </div>
      {entries.length > 0 && (
        <ul className="border-t border-line">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{e.name}</span>
              <span className="num text-muted">
                {e.grams} g · {Math.round(entryMacros(e).kcal)} kcal
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
