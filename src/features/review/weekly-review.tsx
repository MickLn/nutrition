"use client";

import { Label } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { REVIEW } from "@/config/review";
import { useT } from "@/i18n/use-t";
import { toISODate } from "@/lib/dates";
import { useWeekLabel } from "./labels";
import { useReview } from "./use-review";

/** Bilan de la semaine (Figma 10:644, bloc BILANS) : un bilan par semaine terminée, chacun mène à son détail. */
export function WeeklyReview({ today = toISODate(new Date()) }: { today?: string }) {
  const { t } = useT();
  const weekLabel = useWeekLabel();
  const review = useReview(today);
  if (!review) return null;

  return (
    <section>
      <Label>{t("review.list-title")}</Label>
      <div className="mt-1.5">
        {review.weeks.length === 0 && (
          <p className="py-3.5 text-petit text-texte-discret">{t("review.empty", { n: REVIEW.minWeighIns.value })}</p>
        )}
        {review.weeks.map((w) => (
          <Row
            key={w.start}
            href={`/progres/bilan/?week=${w.start}`}
            label={weekLabel(w.start)}
            detail={w.state === "proposal" ? t("review.row-proposal") : t("review.row-protein")}
            value={t("review.row-days", { n: w.proteinDays })}
            chevron
          />
        ))}
      </div>
    </section>
  );
}
