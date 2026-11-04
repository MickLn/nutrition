"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";
import { ManualCodeSheet } from "./manual-code-sheet";
import { useBarcodeCamera } from "./use-camera";

/** État de la recherche du code lu, affiché sous la caméra. */
export type PendingStatus = "looking" | "offline" | "error";

type Props = {
  /** Code lu ou saisi, en attente d'une réponse (écran « hors ligne » : le code est gardé). */
  code: string | null;
  status: PendingStatus | null;
  closeHref: string;
  /** Lien « Saisir les valeurs à la main » quand Open Food Facts n'est pas joignable. */
  createHref: string | null;
  onCode: (code: string) => void;
};

/** Figma 8:415 « Scanner un code-barres » et 47:1551 « Scanner, hors ligne ». */
export function ScannerView({ code, status, closeHref, createHref, onCode }: Props) {
  const { t } = useT();
  const [manual, setManual] = useState(false);
  const { videoRef, state: cameraState, torch, toggleTorch } = useBarcodeCamera(onCode);
  const cameraMsg = cameraState === "denied" ? t("scanner.denied") : cameraState === "unavailable" ? t("scanner.unavailable") : null;
  const message = status ? t(`scanner.${status}`) : cameraMsg;
  const valuesLink = (status === "offline" || status === "error") && createHref;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <PageTitle className="min-w-0 flex-1">{t("scanner.title")}</PageTitle>
        <Link href={closeHref} className="tap shrink-0 text-corps text-actif underline">
          {t("scanner.close")}
        </Link>
      </div>

      {/* Composant « Caméra » : cadre 230 px, ligne de visée orange au milieu. */}
      <div className="relative mt-6 h-[230px] overflow-hidden rounded-base bg-camera" role="img" aria-label={t("scanner.camera")}>
        <video ref={videoRef} muted playsInline aria-hidden className={cn("absolute inset-0 size-full object-cover", cameraState !== "on" && "hidden")} />
        <div className="absolute inset-x-[23px] top-[115px] h-[1.5px] bg-signal" aria-hidden />
      </div>

      {code && <p className="libelle mt-3 text-center [overflow-wrap:anywhere]">{code}</p>}
      <div aria-live="polite">
        {message && <p className="mt-6 text-center text-petit text-texte-discret">{message}</p>}
      </div>

      <div className={cn("flex justify-center", message ? "mt-3" : "mt-9")}>
        {valuesLink ? (
          <Link href={valuesLink} className="tap text-center text-petit text-actif">
            {t("scanner.manual-values")}
          </Link>
        ) : (
          <button onClick={() => setManual(true)} className="tap text-center text-petit text-actif">
            {t("scanner.manual")}
          </button>
        )}
      </div>

      <div className="mt-7 flex justify-center">
        <Button
          variant="secondary"
          className="min-h-11 w-[110px] px-5"
          disabled={!torch.supported}
          aria-pressed={torch.on}
          onClick={toggleTorch}
        >
          {t("scanner.torch")}
        </Button>
      </div>

      <ManualCodeSheet
        open={manual}
        onClose={() => setManual(false)}
        onCode={(c) => {
          setManual(false);
          onCode(c);
        }}
      />
    </div>
  );
}
