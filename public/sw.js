/*
 * Service worker de l'app Nutrition (export statique, aucun serveur).
 * - Fichiers versionnés de Next (/_next/static) : cache d'abord, ils ne changent jamais.
 * - Pages : réseau d'abord, repli sur le cache hors-ligne.
 * - Images Open Food Facts : cache d'abord (vignettes produits).
 */
const VERSION = "v3";
const SHELL = `shell-${VERSION}`;
const STATIC = `static-${VERSION}`;
const IMAGES = `images-${VERSION}`;
const PAGES = [
  "/", "/ajouter/", "/ajouter/scanner/", "/ajouter/aliment/", "/aliment/", "/bienvenue/", "/recettes/", "/progres/",
  "/moi/", "/moi/top/", "/moi/profil/", "/moi/reglages/", "/moi/reglages/objectif/",
  "/moi/reglages/sauvegarde/", "/moi/reglages/apparence/", "/moi/reglages/sources/",
  "/moi/reglages/poids/", "/moi/reglages/notion/",
  "/data/ciqual.json", "/zxing/zxing_reader.wasm", "/data/ciqual-names.en.json",
];

self.addEventListener("install", (event) => {
  // Chaque fichier est mis en cache séparément : une page absente ne bloque pas l'installation.
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => Promise.allSettled(PAGES.map((p) => c.add(p))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = [SHELL, STATIC, IMAGES];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req, STATIC));
  } else if (url.hostname.endsWith("openfoodfacts.org") && req.destination === "image") {
    event.respondWith(cacheFirst(req, IMAGES));
  } else if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req));
  }
});

async function cacheFirst(req, name) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") (await caches.open(name)).put(req, res.clone());
  return res;
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(SHELL)).put(req, res.clone());
    return res;
  } catch {
    return (await caches.match(req, { ignoreSearch: true })) ?? (await caches.match("/")) ?? Response.error();
  }
}
