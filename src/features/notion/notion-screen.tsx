"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BackLink, PageTitle } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { Toggle } from "@/components/ui/toggle";
import { showToast } from "@/components/ui/toast";
import { useSettingsFormat } from "@/features/settings/settings";
import { useT } from "@/i18n/use-t";
import { CodeSheet } from "./code-sheet";
import { runSync } from "./engine";
import { disconnect, saveSecret, setAuto } from "./state";
import { useNotion } from "./use-notion";

/**
 * Écran Réglages › Copie vers Notion (Figma 90:2112).
 * Ajouts par rapport à la maquette : ligne « Code de la copie » (saisi une fois), « En attente » et le message d'erreur.
 */
export function NotionScreen() {
  const { t, n } = useT();
  const f = useSettingsFormat();
  const s = useNotion();
  const [codeOpen, setCodeOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function copy(manual = true) {
    setBusy(true);
    const r = await runSync({ manual });
    setBusy(false);
    if (r.ok) showToast(t("settings.notion.done"));
  }

  return (
    <div className="flex flex-col">
      <BackLink href="/moi/reglages/">{t("settings.back")}</BackLink>
      <PageTitle className="mt-[14px]">{t("settings.notion.title")}</PageTitle>

      <div className="mt-6">
        <div className="flex w-full items-center justify-between gap-3 py-3">
          <span className="text-corps [overflow-wrap:anywhere]">{t("settings.notion.auto")}</span>
          <Toggle on={s.connected && s.auto} onChange={(v) => void setAuto(v)} label={t("settings.notion.auto")} />
        </div>
        <Row
          label={t("settings.notion.code")}
          value={s.loading ? "" : s.connected ? t("settings.notion.code-set") : t("settings.notion.code-none")}
          chevron
          onClick={() => setCodeOpen(true)}
        />
        <Row label={t("settings.notion.last")} value={s.lastSuccess ? f.ago(s.lastSuccess) : t("settings.never")} />
        {s.connected && s.pending !== undefined && s.pending > 0 && <Row label={t("settings.notion.pending")} value={n(s.pending)} />}
        <Row label={t("settings.notion.copied")} detail={t("settings.notion.copied-detail")} />
        <Row label={t("settings.notion.never-copied")} detail={t("settings.notion.never-copied-detail")} />
      </div>

      {s.connected && s.error && (
        <div className="mt-3" role="status">
          <Alert>{t(`settings.notion.error-${s.error}`)}</Alert>
        </div>
      )}

      <Button variant="secondary" className="mt-7" disabled={!s.connected || busy} onClick={() => void copy()}>
        {t("settings.notion.copy-now")}
      </Button>
      <Button variant="link" className="mt-3" disabled={!s.connected} onClick={() => void disconnect()}>
        {t("settings.notion.disconnect")}
      </Button>

      <CodeSheet
        open={codeOpen}
        onClose={() => setCodeOpen(false)}
        onSave={(code) => {
          void saveSecret(code).then(() => copy());
        }}
      />
    </div>
  );
}
