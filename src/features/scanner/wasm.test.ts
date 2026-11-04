import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { ZXING_WASM_SHA256 } from "barcode-detector/ponyfill";
import { SCANNER } from "@/config/scanner";

// Le lecteur WebAssembly est copié dans public/ pour marcher hors ligne.
// Après une mise à jour de barcode-detector, recopier node_modules/zxing-wasm/dist/reader/zxing_reader.wasm.
test("le fichier .wasm servi par l'app correspond à la version installée", () => {
  const file = readFileSync(new URL(`../../../public${SCANNER.wasmUrl}`, import.meta.url));
  expect(createHash("sha256").update(file).digest("hex")).toBe(ZXING_WASM_SHA256);
});
