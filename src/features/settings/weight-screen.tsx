"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BackLink, PageTitle } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { Sheet } from "@/components/ui/sheet";
import { WeightForm } from "@/features/body/weight-block";
import { useT } from "@/i18n/use-t";
import { toISODate } from "@/lib/dates";
import { db } from "@/lib/db";
import { useSettingsFormat } from "./settings";
import { SoonToggleRow } from "./soon-toggle-row";

/**
 * Écran Réglages › Poids et Apple Santé (Figma 90:1991).
 * L'import Apple Santé arrive au lot 5 : interrupteur, Raccourci et code secret sont présents mais désactivés.
 */
export function WeightScreen() {
  const { t, n } = useT();
  const f = useSettingsFormat();
  const [open, setOpen] = useState(false);
  const today = toISODate(new Date());
  const last = useLiveQuery(async () => {
    const rows = await db.weights.toArray();
    return rows.sort((a, b) => a.date.localeCompare(b.date) || a.updatedAt - b.updatedAt).pop() ?? null;
  }, []);

  return (
    <div className="flex flex-col">
      <BackLink href="/moi/reglages/">{t("settings.back")}</BackLink>
      <PageTitle className="mt-[14px]">{t("settings.weight.title")}</PageTitle>

      <div className="mt-6">
        <SoonToggleRow label={t("settings.weight.auto")} />
        <Row
          label={t("settings.weight.last")}
          value={last === undefined ? "" : last === null ? t("settings.never") : t("settings.weight.last-value", { kg: n(last.kg, 1), when: f.day(last.date, today) })}
        />
        <Row label={t("settings.weight.shortcut")} value={t("settings.soon")} />
        <Row label={t("settings.weight.secret")} detail={t("settings.weight.secret-detail")} value={t("settings.soon")} />
      </div>

      <Button variant="secondary" className="mt-7" onClick={() => setOpen(true)}>
        {t("settings.weight.manual")}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} label={t("settings.weight.manual")}>
        <WeightForm today={today} onDone={() => setOpen(false)} />
      </Sheet>
    </div>
  );
}
