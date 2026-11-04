"use client";

import { Button } from "@/components/ui/button";
import { BackLink, PageTitle } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { useT } from "@/i18n/use-t";
import { SoonToggleRow } from "./soon-toggle-row";

/**
 * Écran Réglages › Copie vers Notion (Figma 90:2112).
 * La copie arrive au lot 5 : les commandes sont présentes mais désactivées ; ce qui est copié ou non est déjà décidé.
 */
export function NotionScreen() {
  const { t } = useT();
  return (
    <div className="flex flex-col">
      <BackLink href="/moi/reglages/">{t("settings.back")}</BackLink>
      <PageTitle className="mt-[14px]">{t("settings.notion.title")}</PageTitle>

      <div className="mt-6">
        <SoonToggleRow label={t("settings.notion.auto")} />
        <Row label={t("settings.notion.last")} value={t("settings.never")} />
        <Row label={t("settings.notion.copied")} detail={t("settings.notion.copied-detail")} />
        <Row label={t("settings.notion.never-copied")} detail={t("settings.notion.never-copied-detail")} />
      </div>

      <Button variant="secondary" className="mt-7" disabled>
        {t("settings.notion.copy-now")}
      </Button>
      <Button variant="link" className="mt-3" disabled>
        {t("settings.notion.disconnect")}
      </Button>
    </div>
  );
}
