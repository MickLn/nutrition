"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useT } from "@/i18n/use-t";
import { cleanCode, isValidGtin } from "./gtin";

/** Saisie du code-barres à la main (caméra refusée, code abîmé, pas de caméra). */
export function ManualCodeSheet({ open, onClose, onCode }: { open: boolean; onClose: () => void; onCode: (code: string) => void }) {
  const { t } = useT();
  return (
    <Sheet open={open} onClose={onClose} label={t("scanner.manual-title")}>
      <CodeForm key={String(open)} onCode={onCode} />
    </Sheet>
  );
}

function CodeForm({ onCode }: { onCode: (code: string) => void }) {
  const { t } = useT();
  const [text, setText] = useState("");
  const [tried, setTried] = useState(false);
  const code = cleanCode(text);
  const valid = isValidGtin(code);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (valid) onCode(code);
      }}
    >
      <h2 className="text-section font-medium">{t("scanner.manual-title")}</h2>
      <label className="mt-1.5 flex items-baseline border-b-2 border-actif pb-1.5">
        <span className="sr-only">{t("scanner.manual-label")}</span>
        <input
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-invalid={tried && !valid}
          aria-describedby="code-help"
          className="num w-full min-w-0 bg-transparent text-moyen outline-none"
        />
      </label>
      <p id="code-help" className="mt-2 text-petit text-texte-discret">
        {tried && !valid ? t("scanner.manual-invalid") : t("scanner.manual-help")}
      </p>
      <Button type="submit" disabled={!code} className="mt-8">
        {t("scanner.manual-submit")}
      </Button>
    </form>
  );
}
