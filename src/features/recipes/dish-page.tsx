"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { BackLink, PageTitle } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { showToast } from "@/components/ui/toast";
import { ValueSheet } from "@/components/ui/value-sheet";
import { useT } from "@/i18n/use-t";
import type { Recipe } from "@/lib/db";
import { partMacros, partsLeft, remainingOf, typicalPart } from "./dish";
import { MacroColumns } from "./macro-columns";
import { setRemaining, throwRest } from "./store";
import { useDish, useParts } from "./use-dishes";
import { fromISO, useWhen } from "./when";

/** Page d'un plat : « Plat en lot » (Figma 9:457) et sa fermeture (47:1713) ; un plat classique montre les mêmes blocs sans reste. */
export function DishPage({ id }: { id: string }) {
  const { t } = useT();
  const dish = useDish(id);
  if (!dish)
    return (
      <div className="flex flex-col">
        <BackLink href="/recettes/">{t("dishes.back-recipes")}</BackLink>
        <p className="mt-3.5 text-corps text-texte-discret">{t(dish === null ? "dishes.missing" : "dishes.loading")}</p>
      </div>
    );
  return <DishBody dish={dish} />;
}

function DishBody({ dish }: { dish: Recipe }) {
  const { t, n } = useT();
  const router = useRouter();
  const { when, day } = useWhen();
  const parts = useParts(dish.id) ?? [];
  const [fixing, setFixing] = useState(false);
  const g = t("units.g");
  const batch = dish.kind === "batch";
  const left = remainingOf(dish);
  const open = batch && !dish.finishedAt && (left ?? 0) > 0;
  const estimate = left !== null ? partsLeft(left, typicalPart(parts.map((p) => p.grams))) : null;
  const per100 = partMacros(dish, 100);
  const cooked = dish.cookedWeightG;
  const partHref = `/recettes/part/?id=${encodeURIComponent(dish.id)}`;

  /** Le plat se ferme (0 g ou reste jeté) : on quitte la page, sans question, avec « Annuler ». */
  const close = (undo: () => Promise<void>, text: string) => {
    showToast(text, { label: t("dishes.undo"), run: () => void undo() });
    router.push("/recettes/");
  };

  return (
    <div className="flex flex-col">
      <BackLink href="/recettes/">{t("dishes.back-recipes")}</BackLink>
      <PageTitle className="mt-3.5">{dish.name}</PageTitle>
      <p className="libelle mt-1.5">{t(batch ? "dishes.batch-label" : "dishes.dish-label")}</p>

      {batch && left !== null && (
        <>
          <button
            onClick={() => open && setFixing(true)}
            disabled={!open}
            aria-label={t("dishes.remaining-edit", { n: n(left) })}
            className="num mt-2.5 flex items-baseline gap-2 self-start text-left"
          >
            <span className="text-heros tracking-[-0.04em]">{n(left)}</span>
            <span className="text-valeur text-texte-discret">{t("dishes.left")}</span>
          </button>
          <p className="mt-1.5 flex items-start justify-between gap-3 text-petit">
            <span className="min-w-0 flex-1">
              {dish.finishedAt
                ? t("dishes.finished-on", { when: when(new Date(dish.finishedAt)) })
                : cooked
                  ? t("dishes.of-cooked", { g: n(cooked), when: dish.cookedAt ? when(new Date(dish.cookedAt)) : "" }).trim()
                  : null}
            </span>
            {estimate && <span className="shrink-0 text-texte-discret">{t(`dishes.${estimate.key}`, { n: estimate.n })}</span>}
          </p>
        </>
      )}

      <h2 className="libelle mt-[22px]">{t(cooked ? "dishes.per-100-cooked" : "dishes.per-100")}</h2>
      <div className="mt-1.5">
        <MacroColumns
          items={[
            { label: t("dishes.kcal"), value: n(per100.kcal) },
            { label: t("dishes.protein"), value: n(per100.protein, 1), accent: true },
            { label: t("dishes.carbs"), value: n(per100.carbs, 1) },
            { label: t("dishes.fat"), value: n(per100.fat, 1) },
          ]}
        />
      </div>

      <h2 className="libelle mt-12">{t("dishes.ingredients-weighed")}</h2>
      <div className="mt-1.5">
        {dish.ingredients.map((i) => (
          <Row key={i.foodId} label={i.name ?? i.foodId} value={<span className="text-texte">{`${n(i.grams)} ${g}`}</span>} />
        ))}
        {cooked && <Row label={t("dishes.cooked-weight")} value={<span className="text-texte">{`${n(cooked)} ${g}`}</span>} />}
      </div>

      {parts.length > 0 && (
        <>
          <h2 className="libelle mt-7">{t("dishes.parts-eaten")}</h2>
          <div className="mt-1.5">
            {parts.map((p) => (
              <Row
                key={p.id}
                label={day(fromISO(p.date))}
                detail={t(`meals.${p.meal}`).toLocaleLowerCase()}
                value={<span className="text-texte">{`${n(p.grams)} ${g}`}</span>}
              />
            ))}
          </div>
        </>
      )}

      {(open || !batch) && (
        <Link href={partHref} className={buttonVariants({ className: "mt-7" })}>
          {t("dishes.weigh-part")}
        </Link>
      )}
      <div className="mt-1 flex flex-col items-center">
        {open && (
          <button onClick={async () => close(await throwRest(dish.id), t("dishes.thrown"))} className={buttonVariants({ variant: "link" })}>
            {t("dishes.throw-rest")}
          </button>
        )}
        <Link href={`/recettes/plat/?id=${encodeURIComponent(dish.id)}`} className={buttonVariants({ variant: "link" })}>
          {t("dishes.edit")}
        </Link>
      </div>

      {open && left !== null && (
        <ValueSheet
          open={fixing}
          onClose={() => setFixing(false)}
          title={t("dishes.remaining-title")}
          unit={g}
          value={left}
          min={0}
          max={cooked ?? left}
          saveLabel={t("dishes.remaining-save")}
          onSave={async (v) => {
            const undo = await setRemaining(dish.id, v);
            if (v <= 0) close(undo, t("dishes.finished"));
          }}
        />
      )}
    </div>
  );
}
