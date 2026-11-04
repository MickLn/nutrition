"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { useT } from "@/i18n/use-t";
import type { Meal } from "@/lib/db";

const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];

/** Titre = repas déduit de l'heure ; un tap ouvre le choix du repas. */
export function MealPicker({ meal, onChange }: { meal: Meal; onChange: (m: Meal) => void }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex min-h-11 items-center gap-1.5 text-page" aria-label={`${t("add.meal")} : ${t(`meals.${meal}`)}`}>
        {t(`meals.${meal}`)}
        <ChevronDown className="size-5 text-texte-discret" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} label={t("add.meal")}>
        <p className="libelle">{t("add.meal")}</p>
        <ul className="mt-2">
          {MEALS.map((m) => (
            <li key={m}>
              <button
                aria-pressed={m === meal}
                onClick={() => {
                  onChange(m);
                  setOpen(false);
                }}
                className={`flex min-h-11 w-full items-center rounded-base px-3 text-left text-corps ${m === meal ? "bg-actif-leger font-medium text-actif" : ""}`}
              >
                {t(`meals.${m}`)}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
