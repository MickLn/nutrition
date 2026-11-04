import { CALENDAR } from "@/config/calendar";
import { toISODate } from "@/lib/dates";

/** Mois affiché : année et mois de 1 à 12. */
export type Month = { year: number; month: number };

export const monthOf = (iso: string): Month => {
  const [year, month] = iso.split("-").map(Number);
  return { year, month };
};

export const shiftMonth = ({ year, month }: Month, by: number): Month => {
  const d = new Date(year, month - 1 + by, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

/** Premier et dernier jour du mois (AAAA-MM-JJ). */
export const monthRange = ({ year, month }: Month): [string, string] => [toISODate(new Date(year, month - 1, 1)), toISODate(new Date(year, month, 0))];

/** Semaines du mois : 7 cases par semaine, `null` avant le 1er et après le dernier jour. */
export function monthGrid({ year, month }: Month, weekStartsOn: number = CALENDAR.weekStartsOn): (string | null)[][] {
  const lead = (new Date(year, month - 1, 1).getDay() - weekStartsOn + 7) % 7;
  const days = new Date(year, month, 0).getDate();
  const cells: (string | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => toISODate(new Date(year, month - 1, i + 1)))];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}
