import { GOAL } from "@/config/goal";
import { STRENGTH_DEFAULTS, type AdjustCap, type Profile } from "@/config/profile";
import { RULES } from "@/config/rules";
import { addDays } from "@/lib/dates";

/** Calculs purs de la page Objectif : date estimée, rythme nécessaire, bornes du poids visé, calendrier. */

/** Rythme de perte le plus rapide accepté : 0,7 %/sem. avec Musculation (Garthe 2011), 1 %/sem. sans (Helms 2014). */
export function maxPctPerWeek(strength: boolean): number {
  return strength ? RULES.lossPctPerWeek.value : RULES.maxLossPctPerWeek.value;
}

/** Perte d'une semaine à ce rythme, plafonnée à 0,9 kg (CDC). */
export function weeklyLossKg(weightKg: number, pct: number): number {
  return Math.min(pct * weightKg, RULES.maxLossKgPerWeek.value);
}

/** Semaines pour passer de `fromKg` à `goalKg` (le rythme s'applique au poids de chaque semaine). 0 si déjà atteint. */
export function weeksToGoal(fromKg: number, goalKg: number, pct: number): number {
  let w = fromKg;
  let weeks = 0;
  while (w > goalKg && weeks < GOAL.maxWeeks.value) {
    const loss = weeklyLossKg(w, pct);
    if (loss <= 0) return Infinity;
    if (w - loss <= goalKg) return weeks + (w - goalKg) / loss;
    w -= loss;
    weeks++;
  }
  return w > goalKg ? Infinity : weeks;
}

/** Date estimée d'arrivée (AAAA-MM-JJ) au rythme donné, ou null si hors de portée. */
export function arrivalDate(today: string, fromKg: number, goalKg: number, pct: number): string | null {
  const weeks = weeksToGoal(fromKg, goalKg, pct);
  return Number.isFinite(weeks) ? addDays(today, Math.ceil(weeks * 7)) : null;
}

/** Jours entre deux dates AAAA-MM-JJ (heure locale). */
export function daysBetween(from: string, to: string): number {
  const d = (iso: string) => {
    const [y, m, day] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, day);
  };
  return Math.round((d(to) - d(from)) / 86_400_000);
}

/** Rythme nécessaire pour arriver à la date choisie, en part du poids par semaine. Infinity si la date est passée. */
export function requiredPctPerWeek(fromKg: number, goalKg: number, today: string, date: string): number {
  if (goalKg >= fromKg) return 0;
  const weeks = daysBetween(today, date) / 7;
  if (weeks <= 0) return Infinity;
  return 1 - Math.pow(goalKg / fromKg, 1 / weeks);
}

/** La date choisie demande-t-elle un rythme trop rapide ? Comparée à la date la plus proche raisonnable. */
export function earliestDate(today: string, fromKg: number, goalKg: number, strength: boolean): string | null {
  return arrivalDate(today, fromKg, goalKg, maxPctPerWeek(strength));
}

export function isTooFast(today: string, fromKg: number, goalKg: number, strength: boolean, date: string): boolean {
  const earliest = earliestDate(today, fromKg, goalKg, strength);
  return earliest !== null && date < earliest;
}

/** Poids visé le plus bas accepté : IMC de 18,5 pour la taille (arrondi au dixième supérieur). */
export function minGoalKg(heightCm: number): number {
  return Math.ceil(GOAL.minBmi.value * (heightCm / 100) ** 2 * 10) / 10;
}

export type MonthPart = "early" | "mid" | "late";

/** « début », « mi- » ou « fin » du mois d'une date AAAA-MM-JJ. */
export function monthPart(iso: string): MonthPart {
  const day = Number(iso.slice(8, 10));
  const { mid, late } = GOAL.monthPart.value;
  return day < mid ? "early" : day < late ? "mid" : "late";
}

export function adjustCapOf(p: Pick<Profile, "adjustCapKcal">): AdjustCap {
  return p.adjustCapKcal ?? GOAL.defaultAdjustCap.value;
}

/** Valeur conseillée des protéines selon Musculation (pour « Remettre 2,0 »). */
export function defaultProtein(strength: boolean): number {
  return STRENGTH_DEFAULTS[strength ? "on" : "off"].proteinGPerKg;
}

/** Protéines hors de la fourchette conseillée (1,6 à 2,2 g/kg) : « low », « high » ou null. */
export function proteinWarning(gPerKg: number): "low" | "high" | null {
  const { min, max } = RULES.proteinRange.value;
  return gPerKg < min ? "low" : gPerKg > max ? "high" : null;
}

/** Grille d'un mois, semaines du lundi au dimanche : dates AAAA-MM-JJ ou null hors du mois. `month` de 1 à 12. */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month - 1, 1);
  const days = new Date(year, month, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
