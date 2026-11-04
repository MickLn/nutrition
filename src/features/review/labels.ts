"use client";

import { useCallback } from "react";
import { useT } from "@/i18n/use-t";

/** « Semaine du 6 octobre » à partir du premier jour de la semaine (AAAA-MM-JJ). */
export function useWeekLabel() {
  const { t, locale } = useT();
  return useCallback(
    (start: string) => {
      const [y, m, d] = start.split("-").map(Number);
      return t("review.week-of", { date: new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(new Date(y, m - 1, d)) });
    },
    [t, locale],
  );
}
