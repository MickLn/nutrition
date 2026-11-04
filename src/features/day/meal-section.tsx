"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { LogEntry, Meal } from "@/lib/db";
import { useT } from "@/i18n/use-t";
import { entryMacros, sumMacros } from "@/lib/nutrition";

/** Un créneau du journal (Figma) : titre, total et chevron qui replie ; lignes d'aliments (tap = modifier) ; liens si vide. */
export function MealSection({
  meal,
  date,
  entries,
  canCopy,
  onEdit,
  onCopyYesterday,
}: {
  meal: Meal;
  date: string;
  entries: LogEntry[];
  /** La veille a des aliments dans ce créneau. */
  canCopy: boolean;
  onEdit: (e: LogEntry) => void;
  onCopyYesterday: (meal: Meal) => void;
}) {
  const { t, n } = useT();
  const [open, setOpen] = useState(true);
  const kcal = sumMacros(entries).kcal;
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <section className="mt-8">
      {entries.length > 0 ? (
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="-my-3 flex min-h-11 w-full items-center justify-between gap-3">
          <h2 className="num text-mono-petit uppercase">{t(`meals.${meal}`)}</h2>
          <span className="num flex items-center gap-2 text-valeur">
            {n(kcal)} {t("units.kcal")}
            <Chevron className="size-3" strokeWidth={1.5} aria-hidden />
          </span>
        </button>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <h2 className="num text-mono-petit uppercase">{t(`meals.${meal}`)}</h2>
          <span className="num text-valeur">{t("day.empty")}</span>
        </div>
      )}
      {entries.length > 0 && open && (
        <ul className="mt-2.5 flex flex-col gap-2.5">
          {entries.map((e) => (
            <li key={e.id}>
              <button onClick={() => onEdit(e)} className="tap flex w-full items-center justify-between gap-3 text-left">
                <span className="min-w-0 flex-1 text-petit [overflow-wrap:anywhere]">{e.name}</span>
                <span className="num shrink-0 whitespace-pre text-mono-petit text-texte-discret">
                  {`${n(e.grams)} ${t("units.g")}   ${n(entryMacros(e).kcal)}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {entries.length === 0 && (
        <div className="mt-3 flex gap-4 text-petit text-actif">
          <Link href={`/ajouter/?date=${date}&meal=${meal}`} className="tap underline">
            {t("day.add")}
          </Link>
          {canCopy && (
            <button onClick={() => onCopyYesterday(meal)} className="tap underline">
              {t("day.copy-yesterday")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
