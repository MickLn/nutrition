"use client";

import { Toggle } from "@/components/ui/toggle";
import { useT } from "@/i18n/use-t";

/** Ligne à interrupteur du Figma (py 12), désactivée tant que la fonction n'existe pas : « Bientôt » sous le libellé. */
export function SoonToggleRow({ label }: { label: string }) {
  const { t } = useT();
  return (
    <div className="flex w-full items-center justify-between gap-3 py-3">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-corps [overflow-wrap:anywhere]">{label}</span>
        <span className="text-petit text-texte-discret">{t("settings.soon")}</span>
      </span>
      {/* Un <fieldset disabled> désactive l'interrupteur sans modifier le composant commun. */}
      <fieldset disabled className="contents [&>*]:opacity-60">
        <Toggle on={false} onChange={() => {}} label={label} />
      </fieldset>
    </div>
  );
}
