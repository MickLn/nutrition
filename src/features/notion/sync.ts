import type { Kind, NotionData, OutgoingItem } from "./schema";

/**
 * Synchronisation par différence (logique pure). La « carte » retient l'empreinte de ce qui a déjà été copié ;
 * on n'envoie que ce qui est nouveau ou changé, et on archive ce qui a disparu de l'app.
 */
export type LibraryItem = { kind: Kind; id: string; data: NotionData };
export type SyncMap = Record<string, string>;
export type Outgoing = OutgoingItem & { fingerprint?: string };

export const keyOf = (kind: Kind, id: string) => `${kind}:${id}`;

/** Texte JSON identique pour des données identiques, quel que soit l'ordre des champs. */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

/** Empreinte (cyrb53) du contenu ; la date de modification n'en fait pas partie. */
export function fingerprint(data: NotionData): string {
  const { updatedAt: _ignored, ...content } = data;
  void _ignored;
  const s = stable(content);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** Ce qu'il reste à envoyer : nouveautés et changements d'abord, puis archivages. */
export function diffLibrary(items: LibraryItem[], map: SyncMap): Outgoing[] {
  const out: Outgoing[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const key = keyOf(it.kind, it.id);
    seen.add(key);
    const fp = fingerprint(it.data);
    if (map[key] !== fp) out.push({ kind: it.kind, id: it.id, op: "upsert", data: it.data, fingerprint: fp });
  }
  for (const key of Object.keys(map)) {
    if (seen.has(key)) continue;
    const i = key.indexOf(":");
    out.push({ kind: key.slice(0, i) as Kind, id: key.slice(i + 1), op: "archive" });
  }
  return out;
}

export function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/** Met la carte à jour pour les seuls éléments terminés (`done`). */
export function applyDone(map: SyncMap, sent: Outgoing[], done: string[]): SyncMap {
  const ok = new Set(done);
  const next = { ...map };
  for (const it of sent) {
    if (!ok.has(it.id)) continue;
    const key = keyOf(it.kind, it.id);
    if (it.op === "archive") delete next[key];
    else if (it.fingerprint) next[key] = it.fingerprint;
  }
  return next;
}

/** L'échec dure-t-il depuis assez longtemps pour le signaler ? */
export function isLate(failingSince: number | null | undefined, now: number, afterDays: number): boolean {
  return typeof failingSince === "number" && now - failingSince >= afterDays * 86_400_000;
}
