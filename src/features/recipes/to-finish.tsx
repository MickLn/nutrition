"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { Gauge } from "@/components/ui/gauge";
import { useT } from "@/i18n/use-t";
import { db } from "@/lib/db";
import { inProgress, partsLeft, remainingOf, typicalPart } from "./dish";

/** Bloc « À finir » de l'écran Jour (Figma 57:1615) : plats en lot en cours, ce qui reste, lien vers « Peser une part ». */
export function ToFinish() {
  const { t, n } = useT();
  const data = useLiveQuery(async () => {
    const dishes = (await db.recipes.where("kind").equals("batch").toArray()).filter(inProgress).sort((a, b) => (a.cookedAt ?? 0) - (b.cookedAt ?? 0)); // le plus ancien d'abord : c'est lui à finir
    const parts = dishes.length ? await db.logEntries.where("refId").anyOf(dishes.map((d) => d.id)).toArray() : [];
    return dishes.map((d) => ({ dish: d, eaten: parts.filter((p) => p.refId === d.id && p.refType === "recipe").map((p) => p.grams) }));
  }, []);
  if (!data?.length) return null;

  return (
    <section className="mt-[22px]">
      <h2 className="libelle">{t("dishes.to-finish")}</h2>
      {data.map(({ dish, eaten }) => {
        const left = remainingOf(dish) ?? 0;
        const estimate = partsLeft(left, typicalPart(eaten));
        return (
          <div key={dish.id} className="mt-3.5">
            <Link
              href={`/recettes/part/?id=${encodeURIComponent(dish.id)}`}
              aria-label={t("dishes.to-finish-open", { name: dish.name, g: n(left) })}
              className="tap flex items-center justify-between gap-3"
            >
              <span className="min-w-0 flex-1 text-corps [overflow-wrap:anywhere]">{dish.name}</span>
              <span className="num shrink-0 whitespace-pre text-valeur">{`${n(left)} ${t("units.g")}  ›`}</span>
            </Link>
            <Gauge className="mt-2" value={left} max={dish.cookedWeightG ?? left} tone="actif" />
            {estimate && <p className="mt-2 text-petit text-texte-discret">{t(`dishes.${estimate.key}`, { n: estimate.n })}</p>}
          </div>
        );
      })}
    </section>
  );
}
