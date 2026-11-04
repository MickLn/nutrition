import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { resetCache } from "@/features/notion/server";
import { GET, POST } from "./route";

type Call = { method: string; url: string; body: unknown };
let calls: Call[];

/** Faux serveur Notion : trouve la page parente, n'a aucune base, ne trouve aucune page. */
function fakeNotion() {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const path = url.replace("http://notion.test", "");
      calls.push({ method: init.method ?? "GET", url: path, body: init.body ? JSON.parse(init.body as string) : undefined });
      const ok = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });
      if (path.startsWith("/blocks/")) return ok({ results: [], has_more: false, next_cursor: null });
      if (path === "/databases") return ok({ id: `db-${calls.filter((c) => c.url === "/databases").length}` });
      if (path.endsWith("/query")) return ok({ results: [] });
      return ok({ id: "page" });
    }),
  );
}

const req = (method: string, body?: unknown, secret: string | null = "s3cret") =>
  new Request("http://app.test/api/notion", {
    method,
    headers: secret === null ? {} : { Authorization: `Bearer ${secret}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const food = { name: "Skyr", source: "custom", kcal: 60, protein: 10, carbs: 4, fat: 0.2, updatedAt: 1 };

beforeEach(() => {
  resetCache();
  vi.stubEnv("NOTION_SYNC_SECRET", "s3cret");
  vi.stubEnv("NOTION_TOKEN", "tok");
  vi.stubEnv("NOTION_PAGE_ID", "parent");
  vi.stubEnv("NOTION_API_URL", "http://notion.test");
  vi.stubEnv("NOTION_REQUEST_GAP_MS", "0");
  fakeNotion();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("mauvais code : 401, rien n'est envoyé à Notion", async () => {
  expect((await GET(req("GET", undefined, "faux"))).status).toBe(401);
  expect((await POST(req("POST", { items: [] }, "faux"))).status).toBe(401);
  expect((await GET(req("GET", undefined, null))).status).toBe(401);
  expect(calls).toHaveLength(0);
});

test("variables manquantes : 503", async () => {
  vi.stubEnv("NOTION_TOKEN", "");
  const res = await GET(req("GET"));
  expect(res.status).toBe(503);
  expect(await res.json()).toEqual({ error: "not_configured" });
  vi.stubEnv("NOTION_SYNC_SECRET", "");
  expect((await GET(req("GET"))).status).toBe(503);
});

test("GET : vérifie la page parente", async () => {
  const res = await GET(req("GET"));
  expect(await res.json()).toEqual({ ok: true });
  expect(calls[0]).toMatchObject({ method: "GET", url: "/pages/parent" });
});

test("POST : crée les bases puis la page, et répond done", async () => {
  const res = await POST(req("POST", { items: [{ kind: "food", id: "f1", op: "upsert", data: food }] }));
  expect(await res.json()).toEqual({ done: ["f1"], failed: [] });
  expect(calls.filter((c) => c.url === "/databases")).toHaveLength(3);
  const created = calls.find((c) => c.method === "POST" && c.url === "/pages");
  expect(created?.body).toMatchObject({ parent: { database_id: "db-1" } });
});

test("POST : donnée invalide = failed, les autres passent", async () => {
  const res = await POST(
    req("POST", {
      items: [
        { kind: "food", id: "bad", op: "upsert", data: { name: "" } },
        { kind: "food", id: "ok", op: "upsert", data: food },
        { kind: "menu", id: "gone", op: "archive" },
      ],
    }),
  );
  expect(await res.json()).toEqual({ done: ["ok", "gone"], failed: ["bad"] });
});

test("POST : plus de 10 éléments ou corps absurde = 400", async () => {
  const items = Array.from({ length: 11 }, (_, i) => ({ kind: "menu", id: `m${i}`, op: "archive" }));
  expect((await POST(req("POST", { items }))).status).toBe(400);
  expect((await POST(req("POST", { nope: 1 }))).status).toBe(400);
});

test("POST : archive une page existante", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ method: init.method ?? "GET", url, body: init.body ? JSON.parse(init.body as string) : undefined });
      const path = url.replace("http://notion.test", "");
      const ok = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });
      if (path.startsWith("/blocks/"))
        return ok({
          results: ["Aliments et produits", "Plats", "Menus"].map((title, i) => ({ id: `db${i}`, type: "child_database", child_database: { title } })),
          has_more: false,
          next_cursor: null,
        });
      if (path.endsWith("/query")) return ok({ results: [{ id: "pg9" }] });
      return ok({});
    }),
  );
  const res = await POST(req("POST", { items: [{ kind: "menu", id: "m1", op: "archive" }] }));
  expect(await res.json()).toEqual({ done: ["m1"], failed: [] });
  const patch = calls.find((c) => c.method === "PATCH");
  expect(patch?.url).toContain("/pages/pg9");
  expect(patch?.body).toEqual({ archived: true });
});
