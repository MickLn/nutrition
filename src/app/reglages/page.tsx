"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Check, Download, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Soon } from "@/components/soon";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import {
  BACKUP_INTERVAL_KEY,
  DEFAULT_BACKUP_INTERVAL_DAYS,
  exportBackup,
  importBackup,
  LAST_BACKUP_KEY,
  readBackup,
  type BackupPreview,
} from "@/lib/backup";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useAppearance } from "@/theme/appearance-provider";
import { themes, type ThemeMode } from "@/theme/themes";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Réglages" />
      <div className="space-y-3">
        <AppearanceCard />
        <BackupCard />
        <StorageCard />
        <Card>
          <CardTitle>Sources des données</CardTitle>
          <p className="mt-2 text-sm text-texte-discret">
            Table de composition nutritionnelle CIQUAL, ANSES (licence ouverte Etalab). Produits industriels : Open Food
            Facts (ODbL).
          </p>
        </Card>
      </div>
    </>
  );
}

function AppearanceCard() {
  const { appearance, setAppearance } = useAppearance();
  return (
    <Card className="space-y-4">
      <CardTitle>Apparence</CardTitle>
      <Segmented<ThemeMode>
        label="Mode d'affichage"
        value={appearance.mode}
        onChange={(mode) => setAppearance({ mode })}
        options={[
          { value: "system", label: "Système" },
          { value: "light", label: "Clair" },
          { value: "dark", label: "Sombre" },
        ]}
      />
      <ul className="space-y-2">
        {themes.map((t) => {
          const selected = t.id === appearance.themeId;
          return (
            <li key={t.id}>
              <button
                onClick={() => setAppearance({ themeId: t.id })}
                aria-pressed={selected}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 rounded-base border bg-fond px-3 text-left transition-transform active:scale-[0.98]",
                  selected ? "border-actif" : "border-trait",
                )}
              >
                <span className="flex -space-x-1.5">
                  {[t.light.fond, t.light.texte, t.light.signal, t.light.actif, t.dark.actif].map((c, i) => (
                    <span key={i} className="size-6 rounded-full border border-trait" style={{ background: c }} />
                  ))}
                </span>
                <span className="flex-1 text-[15px] font-medium">{t.name}</span>
                {selected && <Check className="size-5 text-actif" />}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between text-sm text-texte-discret">
        <span>Couleurs personnalisées</span>
        <Soon phase={11} />
      </div>
    </Card>
  );
}

function BackupCard() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [includeImages, setIncludeImages] = useState(true);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const last = useLiveQuery(() => db.settings.get(LAST_BACKUP_KEY), [])?.value as number | undefined;
  const interval =
    (useLiveQuery(() => db.settings.get(BACKUP_INTERVAL_KEY), [])?.value as number | undefined) ??
    DEFAULT_BACKUP_INTERVAL_DAYS;

  async function onExport() {
    setBusy(true);
    setMessage(null);
    try {
      const r = await exportBackup({ includeImages });
      if (r !== "cancelled") setMessage({ kind: "ok", text: "Sauvegarde créée." });
    } catch {
      setMessage({ kind: "error", text: "La sauvegarde a échoué." });
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | undefined) {
    setMessage(null);
    if (!file) return;
    try {
      setPreview(await readBackup(file));
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    }
  }

  async function onImport(mode: "merge" | "replace") {
    if (!preview) return;
    setBusy(true);
    try {
      await importBackup(preview.backup, mode);
      setMessage({ kind: "ok", text: mode === "merge" ? "Sauvegarde fusionnée." : "Données remplacées." });
      setPreview(null);
    } catch {
      setMessage({ kind: "error", text: "L'import a échoué, rien n'a été modifié." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <CardTitle>Sauvegarde</CardTitle>
        <p className="mt-1 text-sm text-texte-discret">
          Dernière sauvegarde :{" "}
          <span className="num text-texte">{last ? new Date(last).toLocaleDateString("fr-FR") : "jamais"}</span>
        </p>
      </div>

      <label className="flex min-h-11 items-center justify-between gap-3 text-[15px]">
        Inclure mes photos
        <input
          type="checkbox"
          checked={includeImages}
          onChange={(e) => setIncludeImages(e.target.checked)}
          className="size-5 accent-[var(--actif)]"
        />
      </label>

      <label className="flex min-h-11 items-center justify-between gap-3 text-[15px]">
        Me rappeler tous les
        <select
          value={interval}
          onChange={(e) => db.settings.put({ key: BACKUP_INTERVAL_KEY, value: Number(e.target.value) })}
          className="num rounded-base border border-trait bg-fond px-2 py-1.5"
        >
          {[1, 3, 7, 14, 30].map((d) => (
            <option key={d} value={d}>
              {d} j
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={onExport} disabled={busy}>
          <Download className="size-4" /> Exporter
        </Button>
        <Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={busy}>
          <Upload className="size-4" /> Importer
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
      </div>

      {preview && (
        <div className="space-y-3 rounded-base border border-trait bg-fond p-3">
          <p className="text-sm">
            Sauvegarde du <span className="num">{new Date(preview.backup.exportedAt).toLocaleDateString("fr-FR")}</span> :{" "}
            <span className="num">{preview.counts.logEntries}</span> entrées, <span className="num">{preview.counts.foods}</span>{" "}
            aliments, <span className="num">{preview.counts.recipes}</span> recettes,{" "}
            <span className="num">{preview.counts.images}</span> photos.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" onClick={() => onImport("merge")} disabled={busy}>
              Fusionner
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onImport("replace")} disabled={busy}>
              Tout remplacer
            </Button>
          </div>
          <Button size="sm" variant="link" onClick={() => setPreview(null)}>
            Annuler
          </Button>
        </div>
      )}

      {message && (
        <p role="status" className={cn("text-sm", message.kind === "error" ? "font-medium text-texte" : "text-actif")}>
          {message.text}
        </p>
      )}
    </Card>
  );
}

function StorageCard() {
  const [info, setInfo] = useState<{ usage: number; quota: number; persisted: boolean } | null>(null);
  useEffect(() => {
    (async () => {
      const est = await navigator.storage?.estimate?.();
      const persisted = (await navigator.storage?.persisted?.()) ?? false;
      setInfo({ usage: est?.usage ?? 0, quota: est?.quota ?? 0, persisted });
    })();
  }, []);
  const mb = (b: number) => (b / 1024 / 1024).toFixed(1);
  return (
    <Card>
      <CardTitle>Stockage sur cet appareil</CardTitle>
      {info ? (
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-texte-discret">Utilisé</dt>
            <dd className="num">
              {mb(info.usage)} Mo / {mb(info.quota)} Mo
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-texte-discret">Protégé contre l&apos;effacement</dt>
            <dd>{info.persisted ? "Oui" : "Non (installe l'app sur l'écran d'accueil)"}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-sm text-texte-discret">Calcul…</p>
      )}
    </Card>
  );
}
