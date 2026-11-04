"use client";

import { Gauge } from "@/components/ui/gauge";
import { useT } from "@/i18n/use-t";
import type { TopItem, TopMode } from "./stats";

/** Rang sur deux chiffres : « 01 », « 10 ». */
const rank = (i: number) => String(i + 1).padStart(2, "0");

/** Top court de l'écran Moi : rang, nom, nombre de saisies. */
export function TopPreview({ items }: { items: TopItem[] }) {
  const { t, n } = useT();
  return (
    <ol>
      {items.map((it, i) => (
        <li key={it.refId} className="flex items-center gap-3.5 py-3">
          <span className="num shrink-0 text-valeur text-texte-discret">{rank(i)}</span>
          <span className="min-w-0 flex-1 text-corps [overflow-wrap:anywhere]">{it.name}</span>
          <span className="num shrink-0 whitespace-nowrap text-valeur text-texte-discret">{t("me.top-times", { n: n(it.count) })}</span>
        </li>
      ))}
    </ol>
  );
}

/** Top détaillé de l'écran Top 10 : jauge relative au premier, portion habituelle dessous. */
export function TopList({ items, mode }: { items: TopItem[]; mode: TopMode }) {
  const { t, n } = useT();
  const score = (it: TopItem) => (mode === "eaten" ? it.count : it.protein);
  const max = items.length ? score(items[0]) : null;
  return (
    <ol>
      {items.map((it, i) => (
        <li key={it.refId} className="flex items-start gap-3.5 py-3">
          <span className="num shrink-0 text-valeur text-texte-discret">{rank(i)}</span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 flex-1 text-corps [overflow-wrap:anywhere]">{it.name}</span>
              <span className="num shrink-0 whitespace-nowrap text-valeur">
                {mode === "eaten" ? t("me.top-times", { n: n(it.count) }) : t("me.protein-g", { n: n(it.protein) })}
              </span>
            </div>
            <Gauge value={score(it)} max={max} tone="actif" />
            {it.usualGrams !== null && <p className="text-petit text-texte-discret">{t("me.usual", { g: n(it.usualGrams) })}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
