"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBricks } from "@/bricks/use-bricks";
import { needsOnboarding } from "@/features/profile/profile";

/** Au lancement : stockage persistant, service worker, et Première ouverture si l'app est vierge. */
export function AppBoot() {
  const router = useRouter();
  const pathname = usePathname();
  const on = useBricks();
  const onboarding = on("onboarding");

  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {});
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!onboarding || pathname?.startsWith("/bienvenue")) return;
    needsOnboarding().then((yes) => yes && router.replace("/bienvenue/"));
  }, [onboarding, pathname, router]);

  return null;
}
