"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page";
import { showToast } from "@/components/ui/toast";
import { UI } from "@/config/ui";
import { HEALTH } from "@/config/health";
import { importHealthWeights } from "@/features/health/import";
import { parseHealthParams } from "@/features/health/parse";
import { useT } from "@/i18n/use-t";
import { toISODate } from "@/lib/dates";

/**
 * Réception d'une pesée envoyée par le Raccourci iPhone : /sante/#kg=72.4&date=2026-11-04
 * ou /sante/#w=2026-11-03:72.6,2026-11-04:72.4. Les valeurs sont lues dans le fragment `#`,
 * qui reste dans le navigateur (jamais envoyé au serveur). Le `?` est accepté en secours.
 */
export default function HealthPage() {
  return (
    <Suspense>
      <HealthImport />
    </Suspense>
  );
}

function HealthImport() {
  const { t, n } = useT();
  const router = useRouter();
  const raw = useSyncExternalStore(
    () => () => {},
    () => window.location.hash || window.location.search,
    () => null,
  );
  const parsed = useMemo(() => (raw === null ? null : parseHealthParams(raw, toISODate(new Date()))), [raw]);
  const error = parsed && !parsed.ok ? parsed.error : null;
  const started = useRef(false);

  useEffect(() => {
    if (!parsed?.ok || started.current) return;
    started.current = true;
    importHealthWeights(parsed.items).then(({ added }) => {
      showToast(added === 0 ? t("health.already") : added === 1 ? t("health.imported-one") : t("health.imported-other", { n: added }));
      router.replace("/");
    });
  }, [parsed, router, t]);

  if (!error) return <p className="text-corps text-texte-discret">{t("health.importing")}</p>;
  return (
    <div className="flex flex-col">
      <PageTitle>{t("health.error-title")}</PageTitle>
      <div className="mt-6"><Alert>{t(`health.error-${error}`, { min: n(UI.weightKg.min), max: error === "many" ? HEALTH.maxBatch : n(UI.weightKg.max) })}</Alert></div>
      <p className="mt-4 text-corps text-texte-discret">{t("health.error-note")}</p>
      <Button className="mt-7" onClick={() => router.replace("/")}>
        {t("health.go-day")}
      </Button>
    </div>
  );
}
