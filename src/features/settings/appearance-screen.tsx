"use client";

import { BackLink, PageTitle } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { useT } from "@/i18n/use-t";
import { useAppearance } from "@/theme/appearance-provider";
import type { ThemeMode } from "@/theme/themes";

const MODES: ThemeMode[] = ["light", "dark", "system"];

/** Écran Réglages › Apparence (Figma 90:2057) : un seul choix parmi Clair, Sombre, Comme l'iPhone. */
export function AppearanceScreen() {
  const { t } = useT();
  const { appearance, setAppearance } = useAppearance();
  return (
    <div className="flex flex-col">
      <BackLink href="/moi/reglages/">{t("settings.back")}</BackLink>
      <PageTitle className="mt-[14px]">{t("settings.rows.appearance")}</PageTitle>
      <div role="radiogroup" aria-label={t("settings.rows.appearance")} className="mt-6">
        {MODES.map((mode) => (
          <Row
            key={mode}
            label={t(`settings.mode.${mode}`)}
            checked={appearance.mode === mode}
            onClick={() => setAppearance({ mode })}
          />
        ))}
      </div>
    </div>
  );
}
