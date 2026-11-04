"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { FilterGroup } from "@/components/ui/filter";
import { BackLink, PageTitle } from "@/components/ui/page";
import { ME } from "@/config/me";
import { loadTop, type TopMode } from "@/features/me/stats";
import { TopList } from "@/features/me/top-list";
import { useT } from "@/i18n/use-t";
import { toISODate } from "@/lib/dates";

const YEAR = 365;

export default function TopPage() {
  const { t } = useT();
  const today = toISODate(new Date());
  const [mode, setMode] = useState<TopMode>("eaten");
  const [days, setDays] = useState(String(ME.topDays));
  const items = useLiveQuery(() => loadTop(today, Number(days), mode, ME.topCount), [today, days, mode]);

  return (
    <div className="flex flex-col">
      <BackLink href="/moi/">{t("me.title")}</BackLink>
      <PageTitle className="mt-3.5">{t("me.top-title", { count: ME.topCount })}</PageTitle>

      <div className="mt-3">
        <FilterGroup
          label={t("me.mode-label")}
          value={mode}
          onChange={setMode}
          options={[
            { value: "eaten", label: t("me.mode-eaten") },
            { value: "protein", label: t("me.mode-protein") },
          ]}
        />
      </div>
      <div className="mt-3">
        <FilterGroup
          label={t("me.period-label")}
          value={days}
          onChange={setDays}
          options={ME.topPeriods.map((d) => ({ value: String(d), label: d === YEAR ? t("me.period-year") : t("me.period-days", { n: d }) }))}
        />
      </div>

      <div className="mt-2">
        {items && items.length === 0 && <p className="py-3 text-corps text-texte-discret">{t("me.top-empty", { days: Number(days) })}</p>}
        {items && items.length > 0 && <TopList items={items} mode={mode} />}
      </div>
    </div>
  );
}
