"use client";

import { BackLink, PageTitle } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { useT } from "@/i18n/use-t";
import { useAppearance } from "@/theme/appearance-provider";
import { useProfile } from "@/features/profile/profile";
import { HEALTH_AUTO_IMPORT_KEY, useBackupState, useSetting, useSettingsFormat } from "./settings";

/** Écran Moi › Réglages (Figma 12:851). */
export function SettingsHome() {
  const { t, n } = useT();
  const f = useSettingsFormat();
  const { appearance } = useAppearance();
  // Le poids objectif est rangé dans le profil (brique Objectif).
  const goalKg = useProfile()?.goalKg;
  const healthAuto = useSetting<boolean>(HEALTH_AUTO_IMPORT_KEY);
  const { last } = useBackupState();

  return (
    <div className="flex flex-col">
      <BackLink href="/moi/">{t("settings.back-me")}</BackLink>
      <PageTitle className="mt-[14px]">{t("settings.title")}</PageTitle>

      <div className="mt-6">
        <Row
          href="/moi/reglages/objectif/"
          label={t("settings.rows.goal")}
          value={typeof goalKg === "number" ? t("settings.kg", { n: n(goalKg, 1) }) : undefined}
          chevron
        />
        <Row
          href="/moi/reglages/poids/"
          label={t("settings.rows.weight")}
          value={healthAuto ? t("settings.every-morning") : undefined}
          chevron
        />
      </div>

      <div className="mt-6">
        <Row href="/moi/reglages/apparence/" label={t("settings.rows.appearance")} value={t(`settings.mode.${appearance.mode}`)} chevron />
        <Row
          href="/moi/reglages/sauvegarde/"
          label={t("settings.rows.backup")}
          value={last === undefined ? undefined : last === null ? t("settings.never") : f.ago(last)}
          chevron
        />
        <Row href="/moi/reglages/notion/" label={t("settings.rows.notion")} chevron />
      </div>

      <div className="mt-6">
        <Row href="/moi/reglages/sources/" label={t("settings.rows.sources")} chevron />
      </div>
    </div>
  );
}
