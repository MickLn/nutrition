import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { recentFoods } from "@/features/journal/journal";
import { db } from "@/lib/db";
import { deleteDish, eatPart, getDish, partsOf, saveDish, setRemaining, throwRest } from "./store";

const ing = (foodId: string, grams: number, kcal: number) => ({ foodId, grams, name: foodId, per100g: { kcal, protein: 10, carbs: 10, fat: 1, fiber: 1 } });
const draft = { name: "Bolognaise", ingredients: [ing("pasta", 400, 350), ing("beef", 500, 125)], batch: true, cookedG: 1800 };

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("plats en lot", () => {
  it("une part pesée va au journal et le reste baisse", async () => {
    const r = await saveDish(draft);
    const after = await eatPart(r, "2026-11-04", "dinner", 350);
    expect(after.remainingG).toBe(1450);
    const [e] = await partsOf(r.id);
    expect(e).toMatchObject({ refType: "recipe", refId: r.id, name: "Bolognaise", grams: 350, meal: "dinner" });
    // 100 g cuits = (1 400 + 625) ÷ 1 800 × 100
    expect(e.snapshot.kcal).toBeCloseTo(112.5);
    // Une part de plat ne remonte pas dans les aliments récents de la saisie.
    expect(await recentFoods(10)).toEqual([]);
  });
  it("la dernière part ferme le plat", async () => {
    const r = await saveDish(draft);
    await eatPart(r, "2026-11-04", "lunch", 2000);
    expect(await getDish(r.id)).toMatchObject({ remainingG: 0, finishedAt: expect.any(Number) });
  });
  it("« il reste X g » et « jeter le reste » ne comptent rien, et s'annulent", async () => {
    const r = await saveDish(draft);
    await setRemaining(r.id, 600);
    expect((await getDish(r.id))?.remainingG).toBe(600);
    const undo = await throwRest(r.id);
    expect(await getDish(r.id)).toMatchObject({ remainingG: 0, finishedAt: expect.any(Number) });
    await undo();
    expect(await getDish(r.id)).toMatchObject({ remainingG: 600 });
    expect((await getDish(r.id))?.finishedAt).toBeUndefined();
    expect(await db.logEntries.count()).toBe(0);
  });
  it("supprimer un plat garde les repas déjà notés", async () => {
    const r = await saveDish({ ...draft, batch: false });
    await eatPart(r, "2026-11-04", "lunch", 300);
    const undo = await deleteDish(r.id);
    expect(await getDish(r.id)).toBeUndefined();
    expect(await db.logEntries.count()).toBe(1);
    await undo();
    expect(await getDish(r.id)).toBeDefined();
  });
});
