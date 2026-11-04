"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { Label, PageTitle } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { ME } from "@/config/me";
import { loadTop } from "@/features/me/stats";
import { TopPreview } from "@/features/me/top-list";
import { WeekBlock } from "@/features/me/week-block";
import { useT } from "@/i18n/use-t";
import { toISODate } from "@/lib/dates";

export default function MePage() {
  const { t } = useT();
  const today = toISODate(new Date());
  const top = useLiveQuery(() => loadTop(today, ME.topDays, "eaten", ME.homeTopCount), [today]);

  return (
    <div className="pt-5">
      <PageTitle>{t("me.title")}</PageTitle>

      <div className="mt-[26px]">
        <WeekBlock today={today} />
      </div>

      <section className="mt-[50px]">
        <Label>{t("me.top-label", { count: ME.topCount, days: ME.topDays })}</Label>
        {top && top.length === 0 && <p className="mt-1.5 text-corps text-texte-discret">{t("me.top-empty", { days: ME.topDays })}</p>}
        {top && top.length > 0 && (
          <>
            <div className="mt-1.5">
              <TopPreview items={top} />
            </div>
            <Link href="/moi/top/" className="tap mt-3.5 inline-block text-petit text-actif underline">
              {t("me.top-see", { count: ME.topCount })}
            </Link>
          </>
        )}
      </section>

      <section className="mt-6">
        <Label>{t("me.you")}</Label>
        <Row className="mt-1.5" label={t("me.profile")} chevron href="/moi/profil/" />
      </section>

      <section className="mt-7">
        <Label>{t("me.settings")}</Label>
        <Row className="mt-1.5" label={t("me.settings")} chevron href="/moi/reglages/" />
      </section>
    </div>
  );
}
