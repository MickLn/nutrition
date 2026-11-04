"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useRef, useState } from "react";
import { BackupReminder } from "@/components/backup-reminder";
import { showToast } from "@/components/ui/toast";
import { useBricks } from "@/bricks/use-bricks";
import { useBody } from "@/features/body/use-targets";
import { WeightBlock } from "@/features/body/weight-block";
import { DaySummary } from "@/features/day/day-summary";
import { MealSection } from "@/features/day/meal-section";
import { EditEntrySheet } from "@/features/journal/edit-entry-sheet";
import { copyYesterday, hasDataBefore } from "@/features/journal/journal";
import { WaterBlock } from "@/features/water/water-block";
import { useT } from "@/i18n/use-t";
import { addDays, toISODate } from "@/lib/dates";
import { db, type LogEntry, type Meal } from "@/lib/db";
import { sumMacros } from "@/lib/nutrition";

const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];
/** Distance minimale d'un glissement horizontal pour changer de jour, en px. */
const SWIPE_PX = 60;

export default function DayPage() {
  const { t, locale } = useT();
  const on = useBricks();
  const today = toISODate(new Date());
  const [date, setDate] = useState(today);
  const [editing, setEditing] = useState<LogEntry | null>(null);
  const [weightOpen, setWeightOpen] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const entries = useLiveQuery(() => db.logEntries.where("date").equals(date).sortBy("time"), [date]) ?? [];
  const yesterdayMeals = useLiveQuery(
    async () => new Set((await db.logEntries.where("date").equals(addDays(date, -1)).toArray()).map((e) => e.meal)),
    [date],
  );
  const canPrev = useLiveQuery(() => hasDataBefore(date), [date]) ?? false;
  const canNext = date < today;
  const body = useBody(today);
  const total = sumMacros(entries);

  const go = (d: number) => {
    if ((d < 0 && canPrev) || (d > 0 && canNext)) setDate(addDays(date, d));
  };
  const [y, m, d] = date.split("-").map(Number);
  const label = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(new Date(y, m - 1, d));

  return (
    <div
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const s = touch.current;
        if (!s) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > 2 * Math.abs(dy)) go(dx > 0 ? -1 : 1);
        touch.current = null;
      }}
    >
      <header className="flex items-center justify-between text-texte-discret">
        <h1 className="libelle">{label}</h1>
        <div className="flex gap-4 text-petit">
          {canPrev && (
            <button className="tap" aria-label={t("day.prev")} onClick={() => go(-1)}>
              ‹
            </button>
          )}
          {canNext && (
            <button className="tap" aria-label={t("day.next")} onClick={() => go(1)}>
              ›
            </button>
          )}
        </div>
      </header>

      <div className="mt-[18px]">
        <DaySummary total={total} targets={body?.targets ?? null} onNoGoal={() => setWeightOpen(true)} />
      </div>

      {(on("water") || on("body")) && (
        <div className="mt-[22px] flex">
          {on("water") && <WaterBlock date={date} goalL={body?.targets?.waterL ?? null} />}
          {on("body") && <WeightBlock body={body} today={today} open={weightOpen} setOpen={setWeightOpen} />}
        </div>
      )}
      {!on("body") && weightOpen && <WeightBlock body={body} today={today} open={weightOpen} setOpen={setWeightOpen} />}

      <BackupReminder />

      {MEALS.map((meal) => (
        <MealSection
          key={meal}
          meal={meal}
          date={date}
          entries={entries.filter((e) => e.meal === meal)}
          canCopy={!!yesterdayMeals?.has(meal)}
          onEdit={setEditing}
          onCopyYesterday={async (ml) => {
            const { undo } = await copyYesterday(date, ml);
            showToast(t("day.copied", { to: t(`meals-to.${ml}`) }), { label: t("day.undo"), run: undo });
          }}
        />
      ))}

      <EditEntrySheet entry={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
