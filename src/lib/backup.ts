import { z } from "zod";
import { DATA_TABLES, db, SCHEMA_VERSION } from "./db";

type DataTable = (typeof DATA_TABLES)[number];

const backupSchema = z.object({
  app: z.literal("nutrition"),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  tables: z.object(
    Object.fromEntries(DATA_TABLES.map((t) => [t, z.array(z.record(z.string(), z.unknown())).default([])])) as Record<
      DataTable,
      z.ZodDefault<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>
    >,
  ),
  images: z
    .array(z.object({ id: z.string(), type: z.string(), data: z.string(), createdAt: z.number() }))
    .default([]),
});

export type Backup = z.infer<typeof backupSchema>;

export const LAST_BACKUP_KEY = "lastBackupAt";
export const BACKUP_INTERVAL_KEY = "backupIntervalDays";
export const DEFAULT_BACKUP_INTERVAL_DAYS = 7;

export async function buildBackup({ includeImages }: { includeImages: boolean }): Promise<Backup> {
  const tables = {} as Backup["tables"];
  for (const t of DATA_TABLES) {
    tables[t] = (await db.table(t).toArray()).filter((row) => !(t === "settings" && row.key === LAST_BACKUP_KEY));
  }
  const images = includeImages
    ? await Promise.all(
        (await db.images.toArray()).map(async (img) => ({
          id: img.id,
          type: img.blob.type,
          data: await blobToBase64(img.blob),
          createdAt: img.createdAt,
        })),
      )
    : [];
  return { app: "nutrition", schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), tables, images };
}

/** Exporte toute la base dans un fichier JSON. Sur iPhone, ouvre la feuille de partage (Fichiers, iCloud Drive…). */
export async function exportBackup(opts: { includeImages: boolean }): Promise<"shared" | "downloaded" | "cancelled"> {
  const backup = await buildBackup(opts);
  const filename = `nutrition-backup-${backup.exportedAt.slice(0, 10)}.json`;
  const file = new File([JSON.stringify(backup)], filename, { type: "application/json" });

  let result: "shared" | "downloaded" | "cancelled";
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      result = "shared";
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return "cancelled";
      download(file);
      result = "downloaded";
    }
  } else {
    download(file);
    result = "downloaded";
  }
  await db.settings.put({ key: LAST_BACKUP_KEY, value: Date.now() });
  return result;
}

export type BackupPreview = { backup: Backup; counts: Record<DataTable | "images", number> };

export async function readBackup(file: File): Promise<BackupPreview> {
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new Error("Ce fichier n'est pas un JSON valide.");
  }
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Ce fichier n'est pas une sauvegarde de l'app Nutrition.");
  if (parsed.data.schemaVersion > SCHEMA_VERSION)
    throw new Error("Cette sauvegarde vient d'une version plus récente de l'app. Mets l'app à jour d'abord.");
  const backup = parsed.data;
  const counts = Object.fromEntries(DATA_TABLES.map((t) => [t, backup.tables[t].length])) as BackupPreview["counts"];
  counts.images = backup.images.length;
  return { backup, counts };
}

/**
 * "replace" : vide la base puis importe.
 * "merge" : garde, pour chaque id, la version la plus récente (updatedAt).
 */
export async function importBackup(backup: Backup, mode: "merge" | "replace") {
  await db.transaction("rw", [...DATA_TABLES.map((t) => db.table(t)), db.images], async () => {
    if (mode === "replace") {
      await Promise.all([...DATA_TABLES.map((t) => db.table(t).clear()), db.images.clear()]);
    }
    for (const t of DATA_TABLES) {
      const table = db.table(t);
      const rows = backup.tables[t];
      if (mode === "replace" || t === "settings") {
        await table.bulkPut(rows);
        continue;
      }
      const key = table.schema.primKey.keyPath as string;
      const existing = await table.bulkGet(rows.map((r) => r[key] as string));
      const newer = rows.filter((row, i) => {
        const current = existing[i] as { updatedAt?: number } | undefined;
        return !current || Number(row.updatedAt ?? 0) >= Number(current.updatedAt ?? 0);
      });
      await table.bulkPut(newer);
    }
    await db.images.bulkPut(
      backup.images.map((img) => ({ id: img.id, blob: base64ToBlob(img.data, img.type), createdAt: img.createdAt })),
    );
  });
}

function download(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(data: string, type: string): Blob {
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}
