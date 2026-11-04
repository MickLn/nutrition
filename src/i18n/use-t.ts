"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { db } from "@/lib/db";
import { t } from ".";
import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from "./languages";

/** Réglage où est rangée la langue choisie. */
export const LANGUAGE_KEY = "language";

export function useLang(): Language {
  const v = useLiveQuery(() => db.settings.get(LANGUAGE_KEY), [])?.value;
  return typeof v === "string" && v in LANGUAGES ? (v as Language) : DEFAULT_LANGUAGE;
}

/** Textes et format des nombres dans la langue choisie. */
export function useT() {
  const lang = useLang();
  return useMemo(() => {
    const locale = LANGUAGES[lang].meta.locale;
    const nf = (digits: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits, useGrouping: "always" });
    return {
      lang,
      locale,
      t: (key: string, vars?: Record<string, string | number>) => t(key, vars, lang),
      /** Nombre arrondi, séparateurs de la langue (« 1 616 », « 0,75 »). */
      // Espace insécable classique : l’espace fine (U+202F) manque dans la police Outfit.
      n: (v: number, digits = 0) => nf(digits).format(digits ? v : Math.round(v)).replace(/\u202f/g, "\u00a0"),
    };
  }, [lang]);
}
