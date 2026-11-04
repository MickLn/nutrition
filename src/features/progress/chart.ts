import { PROGRESS, type PeriodId } from "@/config/progress";
import { trendSeries, type WeighIn } from "@/engine/weight";
import { daysBetween } from "@/features/goal/goal";
import { addDays } from "@/lib/dates";

/** Logique pure de la page Progrès : points, échelle et tendance des courbes. */

export type Sample = { date: string; value: number; at?: number };
export type Pt = { date: string; value: number };

/** Une mesure par jour (la dernière du jour), triées par date. */
export function dailySamples(samples: Sample[]): Pt[] {
  const byDay = new Map<string, Sample>();
  for (const s of samples) {
    const prev = byDay.get(s.date);
    if (!prev || (s.at ?? 0) >= (prev.at ?? 0)) byDay.set(s.date, s);
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)).map((s) => ({ date: s.date, value: s.value }));
}

/** Premier jour affiché : `days` jours finissant `today` (inclus), ou la première mesure pour « Tout ». */
export function periodFrom(period: PeriodId, today: string, firstDate: string | null): string {
  const days = PROGRESS.periods.find((p) => p.id === period)?.days ?? null;
  if (days === null) return firstDate && firstDate < today ? firstDate : today;
  return addDays(today, -(days - 1));
}

/** Graduations entières de la plus petite pas qui en donne au plus `maxTicks` dans [lo, hi], du haut vers le bas. */
export function niceTicks(lo: number, hi: number, maxTicks: number): number[] {
  for (const step of PROGRESS.tickSteps) {
    const ticks: number[] = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 1000) / 1000);
    if (ticks.length <= maxTicks) return ticks.reverse();
  }
  return [];
}

/** Étendue de l'échelle verticale : min et max des valeurs, avec une marge de 0,5 si tout est au même niveau. */
export function valueRange(values: number[]): { lo: number; hi: number } | null {
  if (!values.length) return null;
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (hi - lo < 1e-9) {
    lo -= 0.5;
    hi += 0.5;
  }
  return { lo, hi };
}

export type XY = { x: number; y: number; date: string; value: number };
export type ChartModel = {
  from: string;
  to: string;
  /** Graduations avec leur position verticale (0 en haut, 1 en bas de la zone des points). */
  ticks: { value: number; y: number }[];
  /** Mesures (points). x et y entre 0 et 1. */
  dots: XY[];
  /** Courbe de tendance (moyenne 7 jours). Vide pour le tour de taille, qui relie ses points. */
  line: XY[];
};

/**
 * Place les points d'une courbe. `line` = la ligne à tracer (tendance du poids, ou les points reliés du tour de taille).
 * x = part de la période (0 au premier jour, 1 au dernier), y = part de la hauteur (0 = valeur la plus haute).
 */
export function buildChart(dots: Pt[], line: Pt[], from: string, to: string, maxTicks: number): ChartModel {
  const span = Math.max(daysBetween(from, to), 1);
  const range = valueRange([...dots, ...line].map((p) => p.value));
  const yOf = (v: number) => (range ? (range.hi - v) / (range.hi - range.lo) : 0.5);
  const xOf = (d: string) => Math.min(Math.max(daysBetween(from, d) / span, 0), 1);
  const place = (p: Pt): XY => ({ x: xOf(p.date), y: yOf(p.value), date: p.date, value: p.value });
  return {
    from,
    to,
    ticks: range ? niceTicks(range.lo, range.hi, maxTicks).map((value) => ({ value, y: yOf(value) })) : [],
    dots: dots.filter((p) => p.date >= from && p.date <= to).map(place),
    line: line.filter((p) => p.date >= from && p.date <= to).map(place),
  };
}

/** Moyenne 7 jours de chaque jour de la période qui en a une. */
export function trendPoints(weights: WeighIn[], from: string, to: string): Pt[] {
  return trendSeries(weights, from, to)
    .filter((p): p is { date: string; avg: number } => p.avg !== null)
    .map((p) => ({ date: p.date, value: p.avg }));
}

/** Évolution entre le premier et le dernier point, en semaines entières (au moins 1). null s'il y a moins de deux points. */
export function change(points: Pt[]): { delta: number; weeks: number } | null {
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  return { delta: last.value - first.value, weeks: Math.max(Math.round(daysBetween(first.date, last.date) / 7), 1) };
}

/** Dates du 1er de chaque mois dans ]from, to], pour les repères sous la courbe. */
export function monthStarts(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = addDays(from, 1); d <= to; d = addDays(d, 1)) if (d.endsWith("-01")) out.push(d);
  return out;
}

/** Garde les repères séparés d'au moins `gap` px (le premier est gardé). `xs` en px, trié. */
export function spreadMarks<T extends { px: number }>(marks: T[], gap: number): T[] {
  const out: T[] = [];
  for (const m of marks) if (!out.length || m.px - out[out.length - 1].px >= gap) out.push(m);
  return out;
}

/** Part du chemin vers l'objectif, entre 0 et 1. null si le départ est déjà sous l'objectif. */
export function goalProgress(startKg: number, currentKg: number, goalKg: number): number | null {
  if (startKg <= goalKg) return null;
  return Math.min(Math.max((startKg - currentKg) / (startKg - goalKg), 0), 1);
}

/** Dernier point d'une liste de mesures datée au plus tard `today`. */
export function lastBefore(points: Pt[], today: string): Pt | null {
  const past = points.filter((p) => p.date <= today);
  return past.length ? past[past.length - 1] : null;
}
