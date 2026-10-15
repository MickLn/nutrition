/** Date locale au format AAAA-MM-JJ (pas d'UTC : minuit doit être celui de l'utilisateur). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return toISODate(new Date(y, m - 1, d + days));
}

export function dayLabel(iso: string, today = toISODate(new Date())): string {
  if (iso === today) return "Aujourd'hui";
  if (iso === addDays(today, -1)) return "Hier";
  if (iso === addDays(today, 1)) return "Demain";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(y, m - 1, d));
}
