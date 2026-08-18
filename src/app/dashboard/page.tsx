import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, ScoreBadge, EmptyState } from "@/components/ui";
import { getAllPartnersSummary, averageOf, getCategoryWeights } from "@/lib/dashboard-data";
import { PeriodSelect } from "./period-select";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const periods = await prisma.period.findMany({ orderBy: { startDate: "desc" } });
  if (periods.length === 0) {
    return (
      <>
        <PageHeader title="Dashboard Partner 360°" />
        <Card>
          <EmptyState>Todavía no hay periodos de evaluación creados. Crea uno desde Administración.</EmptyState>
        </Card>
      </>
    );
  }

  const { period: periodParam } = await searchParams;
  const selectedPeriod = periods.find((p) => p.id === periodParam) ?? periods[0];

  const [summary, categories] = await Promise.all([
    getAllPartnersSummary(selectedPeriod.id),
    getCategoryWeights(),
  ]);

  const overall = averageOf(summary.map((s) => s.overall));
  const totalExpected = summary.reduce((sum, s) => sum + s.expected, 0);
  const totalResponded = summary.reduce((sum, s) => sum + s.responded, 0);
  const responseRate = totalExpected === 0 ? null : Math.round((totalResponded / totalExpected) * 100);

  return (
    <>
      <PageHeader
        title="Dashboard Partner 360°"
        subtitle="Visión agregada de la relación con partners, por periodo."
        actions={<PeriodSelect periods={periods} selectedId={selectedPeriod.id} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Puntuación media</div>
          <div className="mt-2">
            <ScoreBadge score={overall} />
          </div>
        </Card>
        <Card>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Partners evaluados</div>
          <div className="mt-2 text-2xl font-semibold text-text-primary">{summary.length}</div>
        </Card>
        <Card>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Tasa de respuesta</div>
          <div className="mt-2 text-2xl font-semibold text-text-primary">
            {responseRate === null ? "—" : `${responseRate}%`}
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            {totalResponded} / {totalExpected} evaluaciones
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-text-primary">Partners</h2>
          <div className="text-xs text-text-muted">
            Pesos: {categories.map((c) => `${c.code} ${c.weight}%`).join(" · ")}
          </div>
        </div>
        {summary.length === 0 ? (
          <EmptyState>No hay partners activos todavía.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-[var(--border)]">
                  <th className="py-2 font-medium">Partner</th>
                  <th className="py-2 font-medium">Puntuación global</th>
                  <th className="py-2 font-medium">Respuestas</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {summary
                  .slice()
                  .sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1))
                  .map((p) => (
                    <tr key={p.partnerId} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-3 font-medium text-text-primary">{p.name}</td>
                      <td className="py-3">
                        <ScoreBadge score={p.overall} />
                      </td>
                      <td className="py-3 text-text-secondary">
                        {p.responded} / {p.expected}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/dashboard/${p.partnerId}?period=${selectedPeriod.id}`}
                          className="btn btn-secondary text-sm"
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
