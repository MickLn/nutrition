"use client";

import { useEffect } from "react";

/** Au lancement : demande un stockage persistant et enregistre le service worker. */
export function AppBoot() {
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {});
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
