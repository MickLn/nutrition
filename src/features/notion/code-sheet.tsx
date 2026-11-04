"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useT } from "@/i18n/use-t";

/** Panneau pour saisir une fois le code de la copie (même style que « modifier une valeur » : texte souligné en bleu). */
export function CodeSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (code: string) => void }) {
  const { t } = useT();
  return (
    <Sheet open={open} onClose={onClose} label={t("settings.notion.code-title")}>
      <CodeForm onSave={(c) => { onSave(c); onClose(); }} />
    </Sheet>
  );
}

function CodeForm({ onSave }: { onSave: (code: string) => void }) {
  const { t } = useT();
  const [text, setText] = useState("");
  const valid = text.trim().length > 0;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave(text.trim());
      }}
    >
      <h2 className="text-section font-medium">{t("settings.notion.code-title")}</h2>
      <p className="mt-1.5 text-petit text-texte-discret">{t("settings.notion.code-hint")}</p>
      <label className="mt-[18px] block border-b-2 border-actif pb-1.5">
        <span className="sr-only">{t("settings.notion.code-title")}</span>
        <input
          type="password"
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="num w-full min-w-0 bg-transparent text-moyen outline-none"
        />
      </label>
      <Button type="submit" disabled={!valid} className="mt-8">
        {t("settings.notion.code-save")}
      </Button>
    </form>
  );
}
