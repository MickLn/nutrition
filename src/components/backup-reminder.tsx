"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { BACKUP_INTERVAL_KEY, DEFAULT_BACKUP_INTERVAL_DAYS, exportBackup, LAST_BACKUP_KEY } from "@/lib/backup";
import { Alert } from "@/components/ui/alert";
import { useT } from "@/i18n/use-t";
import { db } from "@/lib/db";

const DAY = 24 * 60 * 60 * 1000;

/** iOS interdit l'écriture de fichiers en arrière-plan : on rappelle la sauvegarde à l'ouverture. */
export function BackupReminder() {
  const [busy, setBusy] = useState(false);
  const { t } = useT();
  const state = useLiveQuery(async () => {
    const [last, interval, entries] = await Promise.all([
      db.settings.get(LAST_BACKUP_KEY),
      db.settings.get(BACKUP_INTERVAL_KEY),
      db.logEntries.count(),
    ]);
    const lastAt = (last?.value as number | undefined) ?? null;
    const days = (interval?.value as number | undefined) ?? DEFAULT_BACKUP_INTERVAL_DAYS;
    const elapsed = lastAt === null ? null : Date.now() - lastAt;
    return {
      show: entries > 0 && (elapsed === null || elapsed > days * DAY),
      daysSince: elapsed === null ? null : Math.floor(elapsed / DAY),
    };
  }, []);

  if (!state?.show) return null;
  const days = state.daysSince;
  return (
    <div className="mt-2 flex items-center justify-between gap-3">
      <Alert>{days === null ? t("backup.none") : t("backup.since", { n: days })}</Alert>
      <button
        className="tap shrink-0 text-petit text-actif"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await exportBackup({ includeImages: true });
          } finally {
            setBusy(false);
          }
        }}
      >
        {t("backup.save")}
      </button>
    </div>
  );
}
