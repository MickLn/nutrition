"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useState } from "react";
import { useBricks } from "@/bricks/use-bricks";
import { ciqualFoods, fromCustom } from "@/features/foods/catalog";
import { getFood } from "@/features/foods/store";
import type { FoodItem } from "@/features/foods/types";
import { useLang } from "@/i18n/use-t";
import { cookedInfo, weighingTarget, type CookedInfo } from "./cooked";
import { PAIRS } from "./pairs";
import { getBaseYields } from "./store";

const maps = new WeakMap<FoodItem[], Map<string, FoodItem>>();

/** Table CIQUAL par id, chargée une fois (même cache que la recherche). */
function useCiqual(): ((id: string) => FoodItem | undefined) | null {
  const lang = useLang();
  const [map, setMap] = useState<Map<string, FoodItem> | null>(null);
  useEffect(() => {
    let alive = true;
    ciqualFoods(lang)
      .then((items) => {
        if (!maps.has(items)) maps.set(items, new Map(items.map((i) => [i.id, i])));
        if (alive) setMap(maps.get(items)!);
      })
      .catch(() => alive && setMap(new Map()));
    return () => {
      alive = false;
    };
  }, [lang]);
  return useMemo(() => (map ? (id: string) => map.get(id) : null), [map]);
}

export type UseCooked = CookedInfo & {
  /** L'aliment cru, relu dans le catalogue (une saisie récente peut porter des valeurs cuites). */
  base: FoodItem;
  /** Les données sont chargées : la conversion affichée est la bonne. */
  ready: boolean;
};

/** Tout ce qu'il faut pour peser un aliment cru ou cuit. Brique « cooked » éteinte : jamais disponible. */
export function useCooked(food: FoodItem): UseCooked {
  const on = useBricks()("cooked");
  const ciqual = useCiqual();
  const isProduct = weighingTarget(food.id) === "product";
  const product = useLiveQuery(async () => (isProduct ? ((await getFood(food.id)) ?? null) : null), [food.id, isProduct]);
  const baseYields = useLiveQuery(getBaseYields, []);

  const base = (isProduct ? product && fromCustom(product) : ciqual?.(food.id)) || food;
  const ready = !!ciqual && product !== undefined && baseYields !== undefined;
  const info = cookedInfo(base, { pairs: PAIRS, ciqual: ciqual ?? (() => undefined), productYield: product?.cookedYield, baseYields: baseYields ?? {} });
  return { ...info, available: on && info.available, base, ready };
}
