"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import type { FoodItem } from "@/features/foods/types";
import { useT } from "@/i18n/use-t";
import { weighingTarget } from "./cooked";
import { saveWeighing } from "./store";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Aliment pesé : un aliment de base CIQUAL (« Pâtes ») ou un produit. */
  food: FoodItem;
  /** Rendement déjà noté, pour pré-remplir. */
  currentYield?: number;
  /** Appelé après l'enregistrement, avec le nouveau rendement. */
  onSaved?: (y: number) => void;
};

/**
 * Écran Figma « Ma pesée, cru puis cuit » (231:2660) : poids cru, poids cuit, rendement, « Enregistrer ma pesée ».
 * Plein écran au-dessus de la saisie (un <dialog>), pour ne pas perdre les aliments déjà choisis.
 */
export function MaPesee({ open, onClose, food, currentYield, onSaved }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useT();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} aria-label={t("cooked.my-weighing")} onClose={onClose} className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto bg-fond p-0 text-texte">
      {open && <Form key={food.id} food={food} currentYield={currentYield} onClose={onClose} onSaved={onSaved} />}
    </dialog>
  );
}

function Form({ food, currentYield, onClose, onSaved }: Omit<Props, "open">) {
  const { t, n } = useT();
  const [raw, setRaw] = useState<number | null>(currentYield ? 100 : null);
  const [cooked, setCooked] = useState<number | null>(currentYield ? Math.round(100 * currentYield) : null);
  const [failed, setFailed] = useState(false);
  const valid = !!raw && raw > 0 && !!cooked && cooked > 0;
  const y = valid ? cooked / raw : undefined;

  return (
    <form
      className="mx-auto flex min-h-full max-w-md flex-col px-[22px] pt-[max(env(safe-area-inset-top),24px)]"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        try {
          const saved = await saveWeighing(food.id, raw, cooked);
          onSaved?.(saved);
          onClose();
        } catch {
          setFailed(true);
        }
      }}
    >
      <button type="button" onClick={onClose} className="tap self-start text-petit text-actif">
        ‹ {t("cooked.back")}
      </button>
      <PageTitle className="mt-[14px]">{t("cooked.my-weighing")}</PageTitle>
      <h2 className="libelle mt-5">{t(weighingTarget(food.id) === "base" ? "cooked.base-food" : "cooked.product")}</h2>
      <span className="num mt-1.5 self-start rounded-base bg-actif-leger px-2.5 py-1.5 text-mono-petit font-medium text-actif [overflow-wrap:anywhere]">{food.name}</span>
      <BigGrams label={t("cooked.raw-weight")} unit={t("units.g")} value={raw} onChange={setRaw} autoFocus />
      <BigGrams label={t("cooked.cooked-weight")} unit={t("units.g")} value={cooked} onChange={setCooked} />
      <Row className="mt-2" label={t("cooked.your-yield")} value={y ? t("cooked.yield-value", { y: n(y, 2) }) : t("cooked.none")} />
      {failed && (
        <p role="alert" className="mt-2 text-petit text-texte-discret">
          {t("cooked.save-failed")}
        </p>
      )}
      <div className="flex-1" />
      <div className="sticky bottom-0 bg-fond pb-[calc(16px+env(safe-area-inset-bottom))] pt-6">
        <Button type="submit" disabled={!valid}>
          {t("cooked.save-weighing")}
        </Button>
      </div>
    </form>
  );
}

/** Composant Figma « Champ » en grand chiffre : libellé Mono, « 100 g » en 40 px, soulignement Klein. */
function BigGrams({ label, unit, value, onChange, autoFocus }: { label: string; unit: string; value: number | null; onChange: (v: number | null) => void; autoFocus?: boolean }) {
  const text = value === null ? "" : String(value);
  return (
    <label className="flex w-full flex-col gap-1.5 border-b-2 border-actif py-3">
      <span className="libelle">{label}</span>
      <span className="num flex items-baseline gap-[0.3ch] text-grand tracking-[-0.02em]">
        <input
          inputMode="decimal"
          autoFocus={autoFocus}
          value={text}
          placeholder="0"
          onChange={(e) => {
            const v = parseFloat(e.target.value.replace(",", "."));
            onChange(Number.isFinite(v) && v >= 0 ? v : null);
          }}
          style={{ width: `${Math.max(text.length, 1) + 0.2}ch` }}
          className="min-w-0 max-w-[8ch] bg-transparent text-grand outline-none placeholder:text-texte-discret"
        />
        <span>{unit}</span>
      </span>
    </label>
  );
}
