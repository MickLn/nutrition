import { ChefHat } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Soon } from "@/components/soon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RecipesPage() {
  return (
    <>
      <PageHeader title="Recettes" />
      <Card>
        <EmptyState icon={ChefHat} title="Aucune recette">
          <p>Associe des ingrédients et leurs grammages : l&apos;app calcule les macros pour 100 g cuits et par portion.</p>
        </EmptyState>
        <Button className="w-full" disabled>
          Nouvelle recette
        </Button>
        <p className="mt-3 text-center">
          <Soon phase={6} />
        </p>
      </Card>
    </>
  );
}
