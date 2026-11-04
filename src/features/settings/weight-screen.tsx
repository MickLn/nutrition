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
import { Toggle } from "@/components/ui/toggle";
import { showToast } from "@/components/ui/toast";
import { templateUrl } from "@/features/health/parse";
import { HEALTH_AUTO_IMPORT_KEY, setSetting, useSetting, useSettingsFormat } from "./settings";

/**
 * Écran Réglages › Poids et Apple Santé (Figma 90:1991).
 * Import Apple Santé : un Raccourci iPhone ouvre /sante/#kg=…&date=… ; rien ne quitte le téléphone.
 * L'interrupteur sert seulement à afficher « chaque matin » : l'automatisation se règle dans l'app Raccourcis.
 */
export function WeightScreen() {
  const { t, n } = useT();
  const f = useSettingsFormat();
  const [open, setOpen] = useState(false);
  const [howto, setHowto] = useState(false);
  const auto = useSetting<boolean>(HEALTH_AUTO_IMPORT_KEY) === true;
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(templateUrl(window.location.origin));
      showToast(t("health.copied"));
    } catch {
      showToast(templateUrl(window.location.origin));
    }
  };
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
        <div className="flex w-full items-center justify-between gap-3 py-3">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-corps [overflow-wrap:anywhere]">{t("settings.weight.auto")}</span>
            <span className="text-petit text-texte-discret">{auto ? t("health.auto-every-morning") : t("health.auto-off")}</span>
          </span>
          <Toggle on={auto} onChange={(v) => void setSetting(HEALTH_AUTO_IMPORT_KEY, v)} label={t("settings.weight.auto")} />
        </div>
        <Row
          label={t("settings.weight.last")}
          value={last === undefined ? "" : last === null ? t("settings.never") : t("settings.weight.last-value", { kg: n(last.kg, 1), when: f.day(last.date, today) })}
        />
        <Row label={t("health.howto")} value={t("health.howto-value")} chevron onClick={() => setHowto(true)} />
        <Row label={t("health.url")} detail={t("health.url-detail")} value={t("health.copy")} chevron onClick={copyUrl} />
      </div>

      <Button variant="secondary" className="mt-7" onClick={() => setOpen(true)}>
        {t("settings.weight.manual")}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} label={t("settings.weight.manual")}>
        <WeightForm today={today} onDone={() => setOpen(false)} />
      </Sheet>
      <Sheet open={howto} onClose={() => setHowto(false)} label={t("health.howto-title")}>
        <h2 className="text-section">{t("health.howto-title")}</h2>
        <ol className="mt-4 flex flex-col gap-3 text-corps">
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex gap-3">
              <span className="num text-valeur text-texte-discret">{n(i)}</span>
              <span className="min-w-0 [overflow-wrap:anywhere]">{t(`health.step-${i}`)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-petit text-texte-discret">{t("health.auto-detail")}</p>
        <p className="mt-2 text-petit text-texte-discret">{t("health.privacy")}</p>
        <Button variant="secondary" className="mt-5" onClick={copyUrl}>
          {t("health.copy")}
        </Button>
      </Sheet>
    </div>
  );
}
