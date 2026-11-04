"use client";

import { BackLink, PageTitle } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { SETTINGS } from "@/config/settings";
import { useT } from "@/i18n/use-t";

/** Valeurs qui viennent d'une source publiée (avec détail), puis choix de conception (sans source). */
const SOURCED = ["bmr", "pace", "floor", "protein", "fat", "fiber", "foods"] as const;
const DESIGN_CHOICES = ["activity", "cap", "weeks"] as const;

/** Écran Réglages › Sources (Figma 12:943). */
export function SourcesScreen() {
  const { t, locale } = useT();
  const [y, m, d] = SETTINGS.sourcesConsultedOn.split("-").map(Number);
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(y, m - 1, d));
  return (
    <div className="flex flex-col">
      <BackLink href="/moi/reglages/">{t("settings.back")}</BackLink>
      <PageTitle className="mt-[14px]">{t("settings.sources.title")}</PageTitle>
      <ul className="mt-2.5">
        {SOURCED.map((id) => (
          <li key={id}>
            <Row label={t(`settings.sources.${id}`)} detail={t(`settings.sources.${id}-detail`)} />
          </li>
        ))}
        {DESIGN_CHOICES.map((id) => (
          <li key={id}>
            <Row label={t(`settings.sources.${id}`)} />
          </li>
        ))}
      </ul>
      <p className="num mt-[22px] text-mono-petit text-texte-discret">{t("settings.sources.consulted", { date })}</p>
    </div>
  );
}
