import { createHash, timingSafeEqual } from "node:crypto";
import { NOTION } from "@/config/notion";
import { requestBody, type OutgoingItem } from "@/features/notion/schema";
import { createClient, type NotionEnv } from "@/features/notion/server";

/** Seule route serveur de l'app : relais vers Notion (copie à sens unique). Tourne à Paris. */
export const runtime = "nodejs";
export const preferredRegion = "cdg1";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Comparaison en temps constant : les deux textes sont d'abord ramenés à la même longueur par un hachage. */
function sameSecret(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Vérifie le code ; renvoie la réponse d'erreur ou l'environnement Notion prêt. */
function gate(req: Request): Response | NotionEnv {
  const secret = process.env.NOTION_SYNC_SECRET;
  if (!secret) return json({ error: "not_configured" }, 503);
  const header = req.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!sameSecret(given, secret)) return json({ error: "unauthorized" }, 401);
  const token = process.env.NOTION_TOKEN;
  const pageId = process.env.NOTION_PAGE_ID;
  if (!token || !pageId) return json({ error: "not_configured" }, 503);
  const gap = Number(process.env.NOTION_REQUEST_GAP_MS);
  return {
    token,
    pageId,
    apiUrl: (process.env.NOTION_API_URL || NOTION.defaultApiUrl).replace(/\/$/, ""),
    gapMs: Number.isFinite(gap) && process.env.NOTION_REQUEST_GAP_MS ? gap : NOTION.requestGapMs,
  };
}

export async function GET(req: Request) {
  const env = gate(req);
  if (env instanceof Response) return env;
  try {
    await createClient(env).check();
    return json({ ok: true });
  } catch {
    return json({ error: "notion" }, 502);
  }
}

export async function POST(req: Request) {
  const env = gate(req);
  if (env instanceof Response) return env;
  const raw = await req.text();
  if (raw.length > NOTION.maxBodyBytes) return json({ error: "too_large" }, 413);
  let parsed;
  try {
    parsed = requestBody.safeParse(JSON.parse(raw));
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  if (!parsed.success) return json({ error: "bad_request" }, 400);
  return json(await createClient(env).process(parsed.data.items as OutgoingItem[]));
}
