"use client";

import { Gauge } from "@/components/ui/gauge";
import type { Targets } from "@/engine/targets";
import { useT } from "@/i18n/use-t";
import type { Core } from "@/lib/nutrition";

/** Haut de l'écran du jour (Figma « Accueil ») : kcal en chiffre héros, protéines en avant, puis glucides, lipides, fibres. */
export function DaySummary({ total, targets, onNoGoal }: { total: Core; targets: Targets | null; onNoGoal: () => void }) {
  const { t, n } = useT();
  const left = targets ? targets.kcal - total.kcal : null;
  const proteinLeft = targets ? targets.protein - total.protein : null;
  return (
    <section>
      <p className="num flex flex-wrap items-baseline gap-x-2">
        <span className="text-heros tracking-[-0.04em]">{n(total.kcal)}</span>
        <span className="text-valeur text-texte-discret">{t("day.of-goal", { goal: targets ? n(targets.kcal) : "–" })}</span>
      </p>
      <Gauge className="mt-2" value={total.kcal} max={targets?.kcal ?? null} tone="signal" />
      {left === null ? (
        <button onClick={onNoGoal} className="-my-3 mt-[-4px] min-h-11 text-left text-petit text-actif">
          {t("day.no-goal")}
        </button>
      ) : (
        <p className="mt-2 text-petit">{left >= 0 ? t("day.left", { n: n(left) }) : t("day.over", { n: n(-left) })}</p>
      )}

      <div className="mt-7 flex items-baseline justify-between gap-3">
        <h2 className="libelle !text-actif">{t("day.protein")}</h2>
        <Value value={total.protein} goal={targets?.protein} />
      </div>
      <Gauge className="mt-2.5" value={total.protein} max={targets?.protein ?? null} tone="actif" />
      {proteinLeft !== null && (
        <p className="mt-2 text-petit text-actif">{proteinLeft > 0 ? t("day.protein-left", { n: n(proteinLeft) }) : t("day.protein-done")}</p>
      )}

      <div className="mt-[22px] flex gap-4">
        {(["carbs", "fat", "fiber"] as const).map((k) => (
          <div key={k} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h2 className="libelle">{t(`day.${k}`)}</h2>
            <Value value={total[k]} goal={targets?.[k]} />
            <Gauge value={total[k]} max={targets?.[k] ?? null} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** « 73 / 150 g » : Chiffre/Moyen puis Mono/Petit discret. */
function Value({ value, goal }: { value: number; goal?: number }) {
  const { t, n } = useT();
  return (
    <p className="num flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-moyen">{n(value)}</span>
      <span className="text-mono-petit text-texte-discret">{goal !== undefined ? `/ ${n(goal)} ${t("units.g")}` : t("units.g")}</span>
    </p>
  );
}
