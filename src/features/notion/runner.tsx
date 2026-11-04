"use client";

import { useEffect } from "react";
import { useBricks } from "@/bricks/use-bricks";
import { NOTION } from "@/config/notion";
import { useSetting } from "@/features/settings/settings";
import { runSync } from "./engine";
import { KEYS } from "./state";

/**
 * Composant sans affichage, monté une fois dans le layout. Il relance la copie vers Notion :
 * au démarrage, au retour de la connexion, au retour au premier plan, puis toutes les N minutes.
 * Il ne fait rien si la brique est éteinte, si aucun code n'est saisi ou si la copie automatique est éteinte.
 */
export function NotionSyncRunner() {
  const brickOn = useBricks()("notion-sync");
  const secret = useSetting<string>(KEYS.secret);
  const auto = useSetting<boolean>(KEYS.auto);
  const active = brickOn && !!secret && auto !== false;

  useEffect(() => {
    if (!active) return;
    const go = () => void runSync();
    const onVisible = () => document.visibilityState === "visible" && go();
    go();
    window.addEventListener("online", go);
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(go, NOTION.syncEveryMinutes * 60_000);
    return () => {
      window.removeEventListener("online", go);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [active]);

  return null;
}
