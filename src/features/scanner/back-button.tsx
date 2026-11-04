"use client";

import { useT } from "@/i18n/use-t";

/**
 * Composant « Retour » du Figma (« ‹ Scanner »), même style que BackLink, mais en bouton :
 * le retour au scanner change l'adresse sans navigation, donc marche hors ligne.
 */
export function BackButton({ onClick }: { onClick: () => void }) {
  const { t } = useT();
  return (
    <button onClick={onClick} className="tap self-start text-petit text-actif">
      ‹ {t("scanner.back")}
    </button>
  );
}
