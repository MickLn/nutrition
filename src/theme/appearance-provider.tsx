"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { db } from "@/lib/db";
import { applyAppearance } from "./apply";
import { appearanceSchema, defaultAppearance, type Appearance } from "./themes";

const APPEARANCE_KEY = "appearance";

type Ctx = { appearance: Appearance; setAppearance: (patch: Partial<Appearance>) => Promise<void> };

const AppearanceContext = createContext<Ctx | null>(null);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const stored = useLiveQuery(() => db.settings.get(APPEARANCE_KEY), []);
  const appearance = useMemo(() => {
    const parsed = appearanceSchema.safeParse(stored?.value ?? {});
    return parsed.success ? parsed.data : defaultAppearance;
  }, [stored]);

  useEffect(() => {
    if (stored === undefined) return; // Dexie pas encore lu : on garde ce que le script anti-flash a posé.
    applyAppearance(appearance);
    if (appearance.mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyAppearance(appearance);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [appearance, stored]);

  const setAppearance = useCallback(
    async (patch: Partial<Appearance>) => {
      await db.settings.put({ key: APPEARANCE_KEY, value: { ...appearance, ...patch } });
    },
    [appearance],
  );

  return <AppearanceContext.Provider value={{ appearance, setAppearance }}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance doit être utilisé dans <AppearanceProvider>");
  return ctx;
}
