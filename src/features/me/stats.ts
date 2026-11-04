import type { Profile } from "@/config/profile";
import { portionShortcut } from "@/engine/entry";
import { startTargets } from "@/engine/targets";
import { average7, type WeighIn } from "@/engine/weight";
import { addDays } from "@/lib/dates";
import { db, type LogEntry, type Water } from "@/lib/db";
import { entryMacros, sumMacros } from "@/lib/nutrition";
import { loadProfile } from "@/features/profile/profile";

type Entry = Pick<LogEntry, "date" | "grams" | "snapshot" | "refId" | "name" | "updatedAt">;

/** Les 7 jours (AAAA-MM-JJ) de la semaine du lundi au dimanche qui contient `today`. */
export function weekDays(today: string): string[] {
  const [y, m, d] = today.split("-").map(Number);
  const fromMonday = (new Date(y, m - 1, d).getDay() + 6) % 7;
  const monday = addDays(today, -fromMonday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** « reached » : objectif de protéines atteint ; « missed » : pas atteint ou pas d'objectif ce jour-là ; « future » : jour à venir. */
export type DayState = "reached" | "missed" | "future";

export type WeekSummary = {
  days: { date: string; state: DayState }[];
  /** false si aucune pesée ne permet de calculer l'objectif de protéines cette semaine. */
  hasGoal: boolean;
  /** Jours avec l'objectif de protéines atteint. */
  reached: number;
  /** Moyenne des calories sur les jours de la semaine qui ont au moins une saisie ; null sans saisie. */
  kcalAvg: number | null;
  /** Jours où l'eau a atteint l'objectif du profil. */
  waterDays: number;
  /** Au moins une saisie ou une dose d'eau cette semaine. */
  hasData: boolean;
};

/** Bilan de la semaine en cours, à partir des données brutes (fonction pure). */
export function weekSummary(input: {
  today: string;
  entries: Entry[];
  water: Pick<Water, "date" | "ml">[];
  weights: WeighIn[];
  profile: Profile;
}): WeekSummary {
  const { today, entries, water, weights, profile } = input;
  const dates = weekDays(today);
  const past = dates.filter((d) => d <= today);
  const goals = new Map(past.map((d) => [d, average7(weights, d)] as const));
  const byDay = (d: string) => entries.filter((e) => e.date === d);

  const days = dates.map((date) => {
    if (date > today) return { date, state: "future" as const };
    const avg = goals.get(date) ?? null;
    const goal = avg === null ? null : startTargets(profile, avg).protein;
    const protein = sumMacros(byDay(date)).protein;
    return { date, state: goal !== null && protein >= goal ? ("reached" as const) : ("missed" as const) };
  });

  const loggedDays = past.filter((d) => byDay(d).length > 0);
  const kcalAvg = loggedDays.length ? loggedDays.reduce((s, d) => s + sumMacros(byDay(d)).kcal, 0) / loggedDays.length : null;

  const goalMl = profile.waterL * 1000;
  const waterDays = goalMl > 0 ? past.filter((d) => water.filter((w) => w.date === d).reduce((s, w) => s + w.ml, 0) >= goalMl).length : 0;

  return {
    days,
    hasGoal: [...goals.values()].some((v) => v !== null),
    reached: days.filter((d) => d.state === "reached").length,
    kcalAvg,
    waterDays,
    hasData: loggedDays.length > 0 || water.some((w) => past.includes(w.date) && w.ml > 0),
  };
}

export type TopMode = "eaten" | "protein";

export type TopItem = {
  refId: string;
  name: string;
  /** Nombre de saisies sur la période. */
  count: number;
  /** Protéines apportées sur la période, en g. */
  protein: number;
  /** Portion la plus fréquente (même règle que le raccourci de portion), null si aucune ne se répète. */
  usualGrams: number | null;
};

/** Aliments classés sur la période : les plus saisis, ou ceux qui apportent le plus de protéines (fonction pure). */
export function topFoods(entries: Entry[], mode: TopMode, limit: number): TopItem[] {
  const groups = new Map<string, Entry[]>();
  for (const e of entries) groups.set(e.refId, [...(groups.get(e.refId) ?? []), e]);
  const items = [...groups].map(([refId, rows]) => {
    const sorted = [...rows].sort((a, b) => a.updatedAt - b.updatedAt);
    return {
      refId,
      name: sorted[sorted.length - 1].name,
      count: rows.length,
      protein: rows.reduce((s, r) => s + entryMacros(r).protein, 0),
      usualGrams: portionShortcut(sorted.map((r) => r.grams)),
    };
  });
  const score = (i: TopItem) => (mode === "eaten" ? i.count : i.protein);
  return items
    .filter((i) => score(i) > 0)
    .sort((a, b) => score(b) - score(a) || b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Bilan de la semaine depuis la base. */
export async function loadWeek(today: string): Promise<WeekSummary> {
  const dates = weekDays(today);
  const [profile, entries, water, weights] = await Promise.all([
    loadProfile(),
    db.logEntries.where("date").between(dates[0], dates[6], true, true).toArray(),
    db.water.where("date").between(dates[0], dates[6], true, true).toArray(),
    db.weights.toArray(),
  ]);
  return weekSummary({ today, entries, water, weights: weights.map((w) => ({ date: w.date, kg: w.kg, at: w.updatedAt })), profile });
}

/** Top des aliments sur les `days` derniers jours, aujourd'hui compris. */
export async function loadTop(today: string, days: number, mode: TopMode, limit: number): Promise<TopItem[]> {
  const entries = await db.logEntries.where("date").between(addDays(today, -(days - 1)), today, true, true).toArray();
  return topFoods(entries, mode, limit);
}
