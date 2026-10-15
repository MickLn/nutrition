"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { CloudUpload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BACKUP_INTERVAL_KEY, DEFAULT_BACKUP_INTERVAL_DAYS, exportBackup, LAST_BACKUP_KEY } from "@/lib/backup";
import { db } from "@/lib/db";

const DAY = 24 * 60 * 60 * 1000;

/** iOS interdit l'écriture de fichiers en arrière-plan : on rappelle la sauvegarde à l'ouverture. */
export function BackupReminder() {
  const [busy, setBusy] = useState(false);
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
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-bg p-3">
      <CloudUpload className="size-5 shrink-0 text-blue" />
      <p className="flex-1 text-sm">
        {days === null ? "Aucune sauvegarde pour l'instant." : `Dernière sauvegarde il y a ${days} jours.`}
      </p>
      <Button
        size="sm"
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
        Sauvegarder
      </Button>
    </div>
  );
}
