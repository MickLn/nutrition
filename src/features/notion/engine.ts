import { NOTION } from "@/config/notion";
import { computeOutgoing } from "./library";
import type { SyncResponse } from "./schema";
import { getAuto, getMap, getSecret, markFailure, markSuccess, setMap, type NotionError } from "./state";
import { applyDone, chunk, type Outgoing } from "./sync";

export type SyncResult = { ok: true; sent: number } | { ok: false; error: NotionError | "offline" | "off" };

const online = () => typeof navigator === "undefined" || navigator.onLine !== false;

async function request(secret: string, init: RequestInit): Promise<Response> {
  return fetch(NOTION.endpoint, {
    ...init,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(NOTION.requestTimeoutMs),
  });
}

function errorFor(status: number): NotionError {
  if (status === 401) return "code";
  if (status === 503) return "config";
  return "server";
}

let running: Promise<SyncResult> | null = null;

/**
 * Copie ce qui a changé vers Notion. Une seule synchronisation à la fois.
 * `manual` : lancée par le bouton (vérifie la connexion même s'il n'y a rien à envoyer, ignore l'interrupteur).
 */
export function runSync(opts: { manual?: boolean } = {}): Promise<SyncResult> {
  if (!running) running = doSync(!!opts.manual).finally(() => (running = null));
  return running;
}

async function doSync(manual: boolean): Promise<SyncResult> {
  const secret = await getSecret();
  if (!secret) return { ok: false, error: "off" };
  if (!manual && !(await getAuto())) return { ok: false, error: "off" };
  if (!online()) return { ok: false, error: "offline" };
  try {
    const pending = await computeOutgoing();
    if (pending.length === 0) {
      if (manual) {
        const res = await request(secret, { method: "GET" });
        if (!res.ok) {
          const error = errorFor(res.status);
          await markFailure(error);
          return { ok: false, error };
        }
        await markSuccess();
      }
      return { ok: true, sent: 0 };
    }
    let map = await getMap();
    let sent = 0;
    let failed = false;
    for (const batch of chunk(pending, NOTION.batchSize)) {
      const res = await request(secret, { method: "POST", body: JSON.stringify({ items: batch.map(strip) }) });
      if (!res.ok) {
        const error = errorFor(res.status);
        await markFailure(error);
        return { ok: false, error };
      }
      const body = (await res.json()) as SyncResponse;
      map = applyDone(map, batch, body.done);
      await setMap(map);
      sent += body.done.length;
      if (body.failed.length > 0) failed = true;
    }
    if (failed) {
      await markFailure("server");
      return { ok: false, error: "server" };
    }
    await markSuccess();
    return { ok: true, sent };
  } catch {
    await markFailure("network");
    return { ok: false, error: "network" };
  }
}

/** Retire l'empreinte, qui ne sert qu'à l'app. */
const strip = ({ fingerprint: _f, ...item }: Outgoing) => {
  void _f;
  return item;
};
