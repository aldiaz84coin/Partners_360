import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, ScoreBadge, EmptyState } from "@/components/ui";
import { getPartnerPeriodScore, getStakeholderGap, getPartnerTrend } from "@/lib/dashboard-data";
import { CategoryBarChart } from "@/components/charts/category-bar-chart";
import { StakeholderGapChart } from "@/components/charts/stakeholder-gap-chart";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { PeriodSelect } from "../period-select";
import { ROLE_LABEL } from "@/lib/chart-colors";

export default async function PartnerDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ partnerId: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { partnerId } = await params;
  const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
  if (!partner) notFound();

  const periods = await prisma.period.findMany({ orderBy: { startDate: "desc" } });
  const { period: periodParam } = await searchParams;
  const selectedPeriod = periods.find((p) => p.id === periodParam) ?? periods[0];

  const [score, gap, trend, comments] = await Promise.all([
    getPartnerPeriodScore(partnerId, selectedPeriod.id),
    getStakeholderGap(partnerId, selectedPeriod.id),
    getPartnerTrend(partnerId),
    prisma.evaluation.findMany({
      where: { partnerId, periodId: selectedPeriod.id, status: "SUBMITTED", comment: { not: null } },
      select: { stakeholderRole: true, comment: true, submittedAt: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        title={partner.name}
        subtitle={partner.description ?? undefined}
        actions={<PeriodSelect periods={periods} selectedId={selectedPeriod.id} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Puntuación global</div>
          <div className="mt-2">
            <ScoreBadge score={score.overall} />
          </div>
        </Card>
        <Card>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Respuestas recibidas</div>
          <div className="mt-2 text-2xl font-semibold text-text-primary">
            {score.responded} / {score.expected}
          </div>
        </Card>
        <Card>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Periodo</div>
          <div className="mt-2 text-2xl font-semibold text-text-primary">{selectedPeriod.label}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h2 className="font-medium text-text-primary mb-1">Puntuación por categoría</h2>
          <p className="text-xs text-text-muted mb-3">Escala normalizada 0-100.</p>
          <CategoryBarChart data={score.categories} />
        </Card>
        <Card>
          <h2 className="font-medium text-text-primary mb-1">Percepción por stakeholder</h2>
          <p className="text-xs text-text-muted mb-3">Diferencias de valoración entre perfiles evaluadores.</p>
          {gap.every((g) => g.score === null) ? (
            <EmptyState>Sin respuestas todavía en este periodo.</EmptyState>
          ) : (
            <StakeholderGapChart data={gap} />
          )}
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="font-medium text-text-primary mb-1">Evolución</h2>
        <p className="text-xs text-text-muted mb-3">Puntuación global por periodo.</p>
        <TrendLineChart data={trend} />
      </Card>

      <Card>
        <h2 className="font-medium text-text-primary mb-4">Observaciones de los evaluadores</h2>
        {comments.length === 0 ? (
          <EmptyState>No hay observaciones registradas en este periodo.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {comments.map((c, i) => (
              <li key={i} className="text-sm border-l-2 border-[var(--border)] pl-3">
                <span className="font-medium text-text-primary">{ROLE_LABEL[c.stakeholderRole]}</span>
                <p className="text-text-secondary mt-0.5">{c.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
