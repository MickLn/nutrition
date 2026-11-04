"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BackLink, PageTitle } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { Sheet } from "@/components/ui/sheet";
import { showToast } from "@/components/ui/toast";
import { SETTINGS } from "@/config/settings";
import { useT } from "@/i18n/use-t";
import { BACKUP_INTERVAL_KEY, exportBackup, importBackup, readBackup, type BackupPreview } from "@/lib/backup";
import { setSetting, useBackupState, useSettingsFormat } from "./settings";

/** Comptes montrés avant un import, dans cet ordre. */
const COUNTED = ["logEntries", "foods", "recipes", "weights", "images"] as const;

/** Écran Réglages › Sauvegarde (Figma 56:1708, import 90:2180). */
export function BackupScreen() {
  const { t } = useT();
  const f = useSettingsFormat();
  const { last, interval } = useBackupState();
  const [usage, setUsage] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [pickInterval, setPickInterval] = useState(false);
  const [preview, setPreview] = useState<(BackupPreview & { name: string }) | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigator.storage
      ?.estimate?.()
      .then((e) => setUsage(e.usage ?? 0))
      .catch(() => setUsage(null));
  }, [last, preview]);

  async function onExport() {
    setBusy(true);
    try {
      if ((await exportBackup({ includeImages: true })) !== "cancelled") showToast(t("settings.backup.exported"));
    } catch {
      showToast(t("settings.backup.export-failed"));
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      setPreview({ ...(await readBackup(file)), name: file.name });
    } catch {
      showToast(t("settings.backup.invalid"));
    }
  }

  async function onImport(mode: "merge" | "replace") {
    if (!preview) return;
    setBusy(true);
    try {
      await importBackup(preview.backup, mode);
      showToast(t(mode === "merge" ? "settings.backup.merged" : "settings.backup.replaced"));
      setPreview(null);
    } catch {
      showToast(t("settings.backup.import-failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col">
      <BackLink href="/moi/reglages/">{t("settings.back")}</BackLink>
      <PageTitle className="mt-[14px]">{t("settings.backup.title")}</PageTitle>

      <div className="mt-6">
        <Row
          label={t("settings.backup.last")}
          value={last === undefined ? "" : last === null ? t("settings.never") : f.ago(last)}
        />
        <Row label={t("settings.backup.reminder")} value={f.every(interval)} chevron onClick={() => setPickInterval(true)} />
        <Row label={t("settings.backup.used")} value={usage === null ? "" : f.size(usage)} />
      </div>

      <Button variant="secondary" className="mt-7" onClick={onExport} disabled={busy}>
        {t("settings.backup.export")}
      </Button>
      <Button variant="secondary" className="mt-3" onClick={() => fileInput.current?.click()} disabled={busy}>
        {t("settings.backup.import")}
      </Button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <Sheet open={pickInterval} onClose={() => setPickInterval(false)} label={t("settings.backup.reminder")}>
        <h2 className="text-section font-medium">{t("settings.backup.reminder")}</h2>
        <div role="radiogroup" aria-label={t("settings.backup.reminder")} className="mt-2">
          {SETTINGS.backupIntervalsDays.map((days) => (
            <Row
              key={days}
              dense
              label={f.every(days)}
              checked={interval === days}
              onClick={async () => {
                await setSetting(BACKUP_INTERVAL_KEY, days);
                setPickInterval(false);
              }}
            />
          ))}
        </div>
      </Sheet>

      <Sheet open={preview !== null} onClose={() => setPreview(null)} label={t("settings.backup.import-title")}>
        {preview && (
          <div className="flex flex-col">
            {/* Le focus va au titre, pas au bouton « Remplacer » : rien de destructif par défaut. */}
            <h2 autoFocus tabIndex={-1} className="text-section font-medium leading-[1.2] outline-none">
              {t("settings.backup.import-title")}
            </h2>
            <p className="mt-1.5 text-petit text-texte-discret [overflow-wrap:anywhere]">{preview.name}</p>
            <p className="mt-[18px] text-petit">
              {COUNTED.map((k) => f.plural(`settings.backup.count.${k}`, preview.counts[k])).join(", ")}
            </p>
            <p className="mt-2.5 text-petit text-texte-discret">{t("settings.backup.import-warning")}</p>
            <Button className="mt-[22px]" onClick={() => onImport("replace")} disabled={busy}>
              {t("settings.backup.replace")}
            </Button>
            <Button variant="secondary" className="mt-2" onClick={() => onImport("merge")} disabled={busy}>
              {t("settings.backup.merge")}
            </Button>
            <Button variant="link" className="mt-2" onClick={() => setPreview(null)}>
              {t("settings.backup.cancel")}
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
