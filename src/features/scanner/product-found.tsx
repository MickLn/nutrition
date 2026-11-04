"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { GramsField } from "@/components/ui/grams-field";
import { Label, PageTitle } from "@/components/ui/page";
import { showToast } from "@/components/ui/toast";
import { fromCustom } from "@/features/foods/catalog";
import { saveFood, type NewFood } from "@/features/foods/store";
import { addEntries } from "@/features/journal/journal";
import { usePortions } from "@/features/journal/use-portions";
import type { MissingValue } from "@/features/off/convert";
import { useT } from "@/i18n/use-t";
import type { Food, Meal } from "@/lib/db";
import { BackButton } from "./back-button";

type Props = {
  food: Food | NewFood;
  /** Déjà enregistré sur le téléphone (aucun « Ne pas enregistrer »). */
  known: boolean;
  missing: MissingValue[];
  date: string;
  meal: Meal;
  onBack: () => void;
  /** Après « Enregistrer le produit » sans quantité : retour à l'écran Ajouter. */
  doneHref: string;
};

/** Figma 8:431 « Produit trouvé » + choix de la quantité (comme l'étape Peser). */
export function ProductFound({ food, known, missing, date, meal, onBack, doneHref }: Props) {
  const { t, n } = useT();
  const router = useRouter();
  const [grams, setGrams] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const { shortcut } = usePortions(food.id ?? "");
  const chips = [...new Set([shortcut, ...food.portions.map((p) => p.grams)].filter((g): g is number => !!g))];
  const sub = [food.brand, food.quantity].filter(Boolean).join(", ");
  // « 10 g », « 3,6 g » : une décimale seulement si elle compte.
  const g = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${Number.isInteger(Math.round(v * 10) / 10) ? n(v) : n(v, 1)} ${t("units.g")}`);
  const values: { key: string; v: number | null | undefined }[] = [
    { key: "protein", v: missing.includes("protein") ? null : food.per100g.protein },
    { key: "carbs", v: missing.includes("carbs") ? null : food.per100g.carbs },
    { key: "fat", v: missing.includes("fat") ? null : food.per100g.fat },
    { key: "fiber", v: food.per100g.fiber },
  ];
  // Sans quantité, un nouveau produit est seulement enregistré (les grammes viendront au moment de manger).
  const label = grams || known ? t("add.to-meal", { to: t(`meals-to.${meal}`) }) : t("scanner.save");

  const submit = async () => {
    setBusy(true);
    try {
      const saved = known ? (food as Food) : await saveFood(food);
      if (grams) {
        await addEntries(date, meal, [{ food: fromCustom(saved), grams }]);
        router.push("/");
      } else {
        showToast(t("scanner.saved", { name: saved.name }));
        router.push(doneHref);
      }
    } catch {
      showToast(t("scanner.save-error"));
      setBusy(false);
    }
  };

  return (
    <div className="pb-24">
      <BackButton onClick={onBack} />
      <PageTitle className="mt-3.5">{food.name}</PageTitle>
      {sub && <p className="mt-1.5 text-petit text-texte-discret [overflow-wrap:anywhere]">{sub}</p>}

      <Label className="mt-[22px]">{t("scanner.per-100g")}</Label>
      <p className="mt-1.5 flex items-baseline gap-2">
        <span className="num text-grand tracking-[-0.02em]">{n(food.per100g.kcal)}</span>
        <span className="num text-valeur text-texte-discret">{t("units.kcal")}</span>
      </p>
      <dl className="mt-3 grid grid-cols-4 gap-3">
        {values.map(({ key, v }) => (
          <div key={key} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-petit text-texte-discret">{t(`scanner.${key}`)}</dt>
            <dd className="num text-moyen">{g(v)}</dd>
          </div>
        ))}
      </dl>
      {food.source === "off" && (
        <p className="mt-3 text-petit text-texte-discret">
          {missing.length ? t("off.missing", { list: missing.map((m) => t(`scanner.${m}`)).join(", ") }) : t("off.source")}
        </p>
      )}

      <Label className="mt-[26px]">{t("scanner.quantity")}</Label>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <GramsField value={grams} onChange={setGrams} label={t("add.grams")} unit={t("units.g")} />
        <div className="flex flex-wrap justify-end gap-1.5">
          {chips.map((c) => (
            <Chip key={c} selected={grams === c} onClick={() => setGrams(c)}>
              {n(c)} {t("units.g")}
            </Chip>
          ))}
        </div>
      </div>
      {!known && <p className="mt-2 text-petit text-texte-discret">{t("scanner.quantity-help")}</p>}

      <div className="fixed inset-x-0 bottom-0 z-40 bg-fond pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-md px-[22px]">
          <Button className="w-full" disabled={busy || (known && !grams)} onClick={submit}>
            {label}
          </Button>
          {!known && (
            <Button variant="link" className="mt-1.5 w-full" onClick={onBack}>
              {t("scanner.skip")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
