import { NOTION } from "@/config/notion";
import { databaseSchema, propertiesFor } from "./properties";
import { dataSchemas, kinds, type Kind, type OutgoingItem, type SyncResponse } from "./schema";

/**
 * Parle à l'API Notion (côté serveur seulement). Appels `fetch` directs, un par un, avec une pause
 * pour respecter la limite de Notion. Ne journalise jamais le contenu des données.
 */
export type NotionEnv = { token: string; pageId: string; apiUrl: string; gapMs: number };

export class NotionError extends Error {
  constructor(public status: number) {
    super(`notion ${status}`);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Identifiants des bases déjà retrouvées, gardés tant que le serveur reste chaud. */
const databaseIds = new Map<string, Record<Kind, string>>();
const cacheKey = (env: NotionEnv) => `${env.apiUrl}|${env.pageId}`;

export function createClient(env: NotionEnv) {
  let first = true;
  async function call<T = Record<string, unknown>>(method: string, path: string, body?: unknown): Promise<T> {
    if (!first) await sleep(env.gapMs);
    first = false;
    const res = await fetch(`${env.apiUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${env.token}`,
        "Notion-Version": NOTION.apiVersion,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new NotionError(res.status);
    return (await res.json()) as T;
  }

  /** Trouve (ou crée) les trois bases sous la page parente. */
  async function databases(): Promise<Record<Kind, string>> {
    const cached = databaseIds.get(cacheKey(env));
    if (cached) return cached;
    const found: Partial<Record<Kind, string>> = {};
    let cursor: string | undefined;
    do {
      const page = await call<{ results: { id: string; type: string; child_database?: { title: string } }[]; has_more: boolean; next_cursor: string | null }>(
        "GET",
        `/blocks/${env.pageId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`,
      );
      for (const b of page.results) {
        if (b.type !== "child_database") continue;
        const kind = kinds.find((k) => NOTION.databases[k] === b.child_database?.title);
        if (kind && !found[kind]) found[kind] = b.id;
      }
      cursor = page.has_more && page.next_cursor ? page.next_cursor : undefined;
    } while (cursor);
    for (const kind of kinds) {
      if (found[kind]) continue;
      const created = await call<{ id: string }>("POST", "/databases", {
        parent: { type: "page_id", page_id: env.pageId },
        title: [{ type: "text", text: { content: NOTION.databases[kind] } }],
        properties: databaseSchema(kind),
      });
      found[kind] = created.id;
    }
    const all = found as Record<Kind, string>;
    databaseIds.set(cacheKey(env), all);
    return all;
  }

  async function findPage(databaseId: string, id: string): Promise<string | null> {
    const r = await call<{ results: { id: string }[] }>("POST", `/databases/${databaseId}/query`, {
      filter: { property: NOTION.columns.appId, rich_text: { equals: id } },
      page_size: 1,
    });
    return r.results[0]?.id ?? null;
  }

  async function apply(item: OutgoingItem) {
    const dbId = (await databases())[item.kind];
    const pageId = await findPage(dbId, item.id);
    if (item.op === "archive") {
      if (pageId) await call("PATCH", `/pages/${pageId}`, { archived: true });
      return;
    }
    const data = dataSchemas[item.kind].parse(item.data);
    const properties = propertiesFor(item.kind, item.id, data);
    if (pageId) await call("PATCH", `/pages/${pageId}`, { properties });
    else await call("POST", "/pages", { parent: { database_id: dbId }, properties });
  }

  return {
    /** Le jeton peut-il lire la page parente ? */
    async check() {
      await call("GET", `/pages/${env.pageId}`);
    },
    /** Traite les éléments l'un après l'autre ; un échec n'arrête pas les suivants. */
    async process(items: OutgoingItem[]): Promise<SyncResponse> {
      const out: SyncResponse = { done: [], failed: [] };
      for (const item of items) {
        try {
          await apply(item);
          out.done.push(item.id);
        } catch {
          out.failed.push(item.id);
          databaseIds.delete(cacheKey(env));
        }
      }
      return out;
    },
  };
}

/** Pour les tests : oublier les bases mémorisées. */
export function resetCache() {
  databaseIds.clear();
}
