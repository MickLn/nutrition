import { Scale } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Soon } from "@/components/soon";
import { Card, CardTitle } from "@/components/ui/card";

export default function ProgressPage() {
  return (
    <>
      <PageHeader title="Progrès" />
      <div className="space-y-3">
        <Card>
          <CardTitle>Poids</CardTitle>
          <EmptyState icon={Scale} title="Pas encore de pesée">
            <p>Saisie manuelle ou bouton « Coller depuis Santé » avec le Raccourci iOS.</p>
            <div className="mt-3">
              <Soon phase={9} />
            </div>
          </EmptyState>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Dépense réelle (TDEE adaptatif)</CardTitle>
            <Soon phase={8} />
          </div>
          <p className="mt-2 text-sm text-texte-discret">Calculée chaque semaine à partir du poids lissé et des calories saisies.</p>
        </Card>
      </div>
    </>
  );
}
