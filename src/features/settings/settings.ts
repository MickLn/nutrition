"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { useT } from "@/i18n/use-t";
import { BACKUP_INTERVAL_KEY, DEFAULT_BACKUP_INTERVAL_DAYS, LAST_BACKUP_KEY } from "@/lib/backup";
import { db } from "@/lib/db";
import { daysBetween, elapsed, size } from "./format";

/**
 * Poids objectif (kg), affiché en face de « Objectif et calcul ».
 * À ranger ici par l'écran Objectif ; tant qu'il n'existe pas, la ligne n'affiche pas de valeur.
 */
export const GOAL_WEIGHT_KEY = "goalWeightKg";
/** Import automatique des pesées depuis Apple Santé (lot 5). */
export const HEALTH_AUTO_IMPORT_KEY = "healthAutoImport";

/** Valeur d'un réglage simple de la table `settings` (undefined pendant la lecture, null si absent). */
export function useSetting<T>(key: string): T | null | undefined {
  return useLiveQuery(async () => ((await db.settings.get(key))?.value as T | undefined) ?? null, [key]);
}

export async function setSetting(key: string, value: unknown) {
  await db.settings.put({ key, value });
}

export function useBackupState() {
  const last = useSetting<number>(LAST_BACKUP_KEY);
  const interval = useSetting<number>(BACKUP_INTERVAL_KEY);
  return { last, interval: interval ?? DEFAULT_BACKUP_INTERVAL_DAYS };
}

/** Textes calculés de la brique Réglages : durées, tailles, pluriels. */
export function useSettingsFormat() {
  const { t, n, locale } = useT();
  return useMemo(() => {
    const rules = new Intl.PluralRules(locale);
    const plural = (key: string, count: number, vars: Record<string, string | number> = {}) =>
      t(`${key}-${rules.select(count) === "one" ? "one" : "other"}`, { n: n(count), ...vars });
    return {
      plural,
      /** « il y a 3 jours », « il y a 5 min », « à l'instant ». */
      ago(at: number, now = Date.now()) {
        const e = elapsed(at, now);
        if (e.unit === "now") return t("settings.ago.now");
        if (e.unit === "day") return plural("settings.ago.day", e.n);
        return t(`settings.ago.${e.unit}`, { n: n(e.n) });
      },
      /** « aujourd'hui », « hier », « il y a 3 jours » pour une date AAAA-MM-JJ. */
      day(iso: string, today: string) {
        const d = daysBetween(iso, today);
        if (d <= 0) return t("settings.day.today");
        if (d === 1) return t("settings.day.yesterday");
        return plural("settings.ago.day", d);
      },
      size(bytes: number) {
        const s = size(bytes);
        return t(`settings.size.${s.unit}`, { n: n(s.n, s.digits) });
      },
      every(days: number) {
        return plural("settings.backup.every", days);
      },
    };
  }, [t, n, locale]);
}
