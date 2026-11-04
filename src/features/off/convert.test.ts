import { afterEach, expect, test, vi } from "vitest";
import { kcalPer100g, offToFood, type OffProduct } from "./convert";
import { fetchOffProduct, productUrl } from "./fetch";

/** Réponses d'exemple, au format de l'API v2 d'Open Food Facts. */
const complete: OffProduct = {
  code: "3017620422003",
  product_name: "Nutella",
  product_name_fr: "Pâte à tartiner Nutella",
  brands: "Nutella, Ferrero",
  quantity: "400 g",
  serving_size: "15 g",
  serving_quantity: "15",
  nutriments: {
    "energy-kcal_100g": 539,
    "energy-kj_100g": 2252,
    proteins_100g: 6.3,
    carbohydrates_100g: 57.5,
    fat_100g: 30.9,
    fiber_100g: 0,
    sugars_100g: 56.3,
    salt_100g: 0.107,
  },
  nutriscore_grade: "e",
  image_front_small_url: "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.248.200.jpg",
};

/** Fiche incomplète : pas de lipides, pas de fibres, pas de nom traduit, Nutri-Score inconnu. */
const incomplete: OffProduct = {
  product_name: "Yaourt grec 0 %",
  brands: "Marque du magasin",
  nutriments: { "energy-kcal_100g": "57", proteins_100g: "10", carbohydrates_100g: 3.6 },
  nutriscore_grade: "unknown",
};

/** Énergie seulement en kJ (fréquent sur les produits importés). */
const kjOnly: OffProduct = {
  product_name: "Crackers",
  nutriments: { energy_100g: 1883, "energy_unit": "kJ", proteins_100g: 9, carbohydrates_100g: 65, fat_100g: 17 },
};

test("fiche complète : valeurs pour 100 g, marque, Nutri-Score, image et portion", () => {
  const r = offToFood(complete, "3017620422003", "fr")!;
  expect(r.missing).toEqual([]);
  expect(r.food).toEqual({
    source: "off",
    name: "Pâte à tartiner Nutella",
    brand: "Nutella",
    barcode: "3017620422003",
    quantity: "400 g",
    per100g: { kcal: 539, protein: 6.3, carbs: 57.5, fat: 30.9, fiber: 0, sugars: 56.3, salt: 0.11 },
    portions: [{ label: "15 g", grams: 15 }],
    nutriscore: "e",
    imageUrl: complete.image_front_small_url,
  });
});

test("nom dans la langue choisie, sinon nom générique", () => {
  expect(offToFood(complete, "3017620422003", "en")!.food.name).toBe("Nutella");
});

test("fiche incomplète : valeur manquante à 0 et signalée, facultatives à null", () => {
  const r = offToFood(incomplete, "2000000000008", "fr")!;
  expect(r.missing).toEqual(["fat"]);
  expect(r.food.per100g).toEqual({ kcal: 57, protein: 10, carbs: 3.6, fat: 0, fiber: null, sugars: null, salt: null });
  expect(r.food.nutriscore).toBeUndefined();
  expect(r.food.portions).toEqual([]);
  expect(r.food.quantity).toBeUndefined();
});

test("sans kcal mais avec kJ : conversion (1 kcal = 4,184 kJ)", () => {
  expect(kcalPer100g(kjOnly.nutriments)).toBe(450);
  expect(kcalPer100g({ "energy-kj_100g": 418.4 })).toBe(100);
  expect(offToFood(kjOnly, "12345670", "fr")!.food.per100g.kcal).toBe(450);
});

test("sans aucune énergie : fiche inutilisable", () => {
  expect(offToFood({ product_name: "Mystère", nutriments: { proteins_100g: 3 } }, "12345670", "fr")).toBeNull();
  expect(offToFood({ product_name: "Vide" }, "12345670", "fr")).toBeNull();
});

test("sans nom : la marque, puis le code", () => {
  const n = { "energy-kcal_100g": 100 };
  expect(offToFood({ brands: "Bonne Maman", nutriments: n }, "12345670", "fr")!.food.name).toBe("Bonne Maman");
  expect(offToFood({ nutriments: n }, "12345670", "fr")!.food.name).toBe("12345670");
});

test("portion ignorée si son unité n'est ni g ni ml", () => {
  const p = { ...complete, serving_quantity: 1, serving_quantity_unit: "piece" };
  expect(offToFood(p, "3017620422003", "fr")!.food.portions).toEqual([]);
});

test("l'adresse appelée ne contient que le code, les champs utiles et le nom de l'app", () => {
  const url = new URL(productUrl("3017620422003", "fr"));
  expect(url.origin + url.pathname).toBe("https://world.openfoodfacts.org/api/v2/product/3017620422003.json");
  expect(url.searchParams.get("app_name")).toBe("Nutrition");
  expect(url.searchParams.get("fields")).toContain("product_name_fr");
  expect(url.searchParams.get("fields")).toContain("nutriments");
});

afterEach(() => vi.unstubAllGlobals());

const reply = (status: number, body: unknown) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

test("appel : produit trouvé, inconnu, réseau coupé, panne, délai dépassé", async () => {
  vi.stubGlobal("fetch", reply(200, { status: 1, product: complete }));
  expect((await fetchOffProduct("3017620422003", "fr")).status).toBe("found");

  vi.stubGlobal("fetch", reply(404, { status: 0, status_verbose: "product not found" }));
  expect(await fetchOffProduct("3017620422003", "fr")).toEqual({ status: "unknown" });

  vi.stubGlobal("fetch", reply(200, { status: 1, product: { product_name: "Sans énergie" } }));
  expect(await fetchOffProduct("3017620422003", "fr")).toEqual({ status: "unknown" });

  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
  expect(await fetchOffProduct("3017620422003", "fr")).toEqual({ status: "offline" });

  vi.stubGlobal("fetch", reply(503, {}));
  expect(await fetchOffProduct("3017620422003", "fr")).toEqual({ status: "error" });

  vi.stubGlobal(
    "fetch",
    vi.fn((_: string, init: RequestInit) => new Promise((_, reject) => init.signal!.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))))),
  );
  expect(await fetchOffProduct("3017620422003", "fr", 10)).toEqual({ status: "error" });
});
