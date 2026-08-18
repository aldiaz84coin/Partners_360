import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { setPeriodStatusAction } from "@/lib/actions/periods";
import { NewPeriodForm } from "./new-period-form";

export default async function AdminPeriodsPage() {
  const periods = await prisma.period.findMany({ orderBy: { startDate: "desc" } });

  return (
    <>
      <PageHeader title="Periodos" subtitle="Ventanas de evaluación trimestrales." />

      <Card className="mb-6">
        <h2 className="font-medium text-text-primary mb-3">Nuevo periodo</h2>
        <NewPeriodForm />
      </Card>

      <Card>
        {periods.length === 0 ? (
          <EmptyState>No hay periodos todavía.</EmptyState>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {periods.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{p.label}</span>
                    <Badge tone={p.status === "OPEN" ? "brand" : undefined}>
                      {p.status === "OPEN" ? "Abierto" : "Cerrado"}
                    </Badge>
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {p.startDate.toLocaleDateString("es-ES")} – {p.endDate.toLocaleDateString("es-ES")}
                  </div>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await setPeriodStatusAction(p.id, p.status === "OPEN" ? "CLOSED" : "OPEN");
                  }}
                >
                  <button type="submit" className="btn btn-secondary text-sm">
                    {p.status === "OPEN" ? "Cerrar periodo" : "Reabrir periodo"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
