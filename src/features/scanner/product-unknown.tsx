"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page";
import { useT } from "@/i18n/use-t";
import { BackButton } from "./back-button";

/** Figma 8:464 « Produit inconnu » : la saisie se fait sur la page « Créer un aliment », code prérempli. */
export function ProductUnknown({ code, onBack, createHref }: { code: string; onBack: () => void; createHref: string }) {
  const { t } = useT();
  return (
    <div className="pb-24">
      <BackButton onClick={onBack} />
      <PageTitle className="mt-3.5">{t("scanner.unknown-title")}</PageTitle>
      <p className="mt-1.5 text-petit text-texte-discret">{t("scanner.unknown-text")}</p>
      <p className="libelle mt-[22px] [overflow-wrap:anywhere]">{t("scanner.code", { code })}</p>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-fond pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-md px-[22px]">
          <Link href={createHref} className={buttonVariants()}>
            {t("scanner.unknown-create")}
          </Link>
          <Button variant="link" className="mt-1.5 w-full" onClick={onBack}>
            {t("scanner.skip")}
          </Button>
        </div>
      </div>
    </div>
  );
}
