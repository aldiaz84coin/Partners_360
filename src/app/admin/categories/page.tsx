import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge } from "@/components/ui";
import { CategoryWeightForm } from "./category-weight-form";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);

  return (
    <>
      <PageHeader
        title="Categorías"
        subtitle="Las 5 dimensiones del marco Partner 360° (ISO 44001) y su peso en la puntuación global."
        actions={<Badge tone={totalWeight === 100 ? undefined : "brand"}>Suma de pesos: {totalWeight}%</Badge>}
      />
      <Card>
        <ul className="divide-y divide-[var(--border)]">
          {categories.map((c) => (
            <li key={c.id} className="py-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="w-16 shrink-0">
                <Badge>{c.code}</Badge>
              </div>
              <div className="flex-1">
                <CategoryWeightForm categoryId={c.id} name={c.name} weight={c.weight} />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
