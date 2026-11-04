"use client";

import { useT } from "@/i18n/use-t";
import { whenLabel } from "./dish";

/** Textes de date des plats : « dimanche » / « le 28 oct. », et « Dimanche » en tête de ligne. */
export function useWhen() {
  const { t, locale } = useT();
  return {
    /** Après un verbe : « cuisiné dimanche », « terminé le 28 oct. ». */
    when: (d: Date) => {
      const w = whenLabel(d, new Date(), locale);
      return w.kind === "weekday" ? t("dishes.when-weekday", { day: w.text }) : t("dishes.when-date", { date: w.text });
    },
    /** En libellé de ligne : « Dimanche », « 28 oct. ». */
    day: (d: Date) => {
      const { text } = whenLabel(d, new Date(), locale);
      return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
    },
  };
}

/** AAAA-MM-JJ → Date locale à midi (pas de décalage de fuseau). */
export const fromISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};
