import Link from "next/link";
import { BarChart3, Route, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, ScoreBadge, EmptyState } from "@/components/ui";
import { getAllPartnersSummary, averageOf, getCategoryWeights } from "@/lib/dashboard-data";
import { DashboardFilters } from "./dashboard-filters";
import type { TechArea } from "@/generated/prisma/enums";

const TECH_AREA_LABEL: Record<string, string> = {
  AUTOMATIZACION: "Automatización",
  DIGITALIZACION: "Digitalización",
};

const CATEGORY_LABEL: Record<string, string> = {
  ESTRATEGICO: "Estratégico",
  ESTANDAR: "Estandard",
  EN_EVALUACION: "En Evaluación",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; area?: string; tech?: string }>;
}) {
  const periods = await prisma.period.findMany({ orderBy: { startDate: "desc" } });
  if (periods.length === 0) {
    return (
      <>
        <div className="mb-2">
          <Badge tone="brand">
            <Route className="h-3.5 w-3.5" aria-hidden />
            Itinerario de Automatización y Digitalización
          </Badge>
        </div>
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <BarChart3 className="h-5 w-5" style={{ color: "var(--brand)" }} aria-hidden />
              Dashboard Partner 360°
            </span>
          }
        />
        <Card>
          <EmptyState>Todavía no hay periodos de evaluación creados. Crea uno desde Administración.</EmptyState>
        </Card>
      </>
    );
  }

  const { period: periodParam, area: areaParam, tech: techParam } = await searchParams;
  const selectedPeriod = periods.find((p) => p.id === periodParam) ?? periods[0];
  const selectedTechArea = areaParam === "AUTOMATIZACION" || areaParam === "DIGITALIZACION" ? areaParam : "ALL";

  const technologies = await prisma.technology.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });
  const selectedTechnologyId = techParam && technologies.some((t) => t.id === techParam) ? techParam : "ALL";

  const [summary, categories] = await Promise.all([
    getAllPartnersSummary(selectedPeriod.id, {
      techArea: selectedTechArea === "ALL" ? undefined : (selectedTechArea as TechArea),
      technologyId: selectedTechnologyId === "ALL" ? undefined : selectedTechnologyId,
    }),
    getCategoryWeights(),
  ]);

  const overall = averageOf(summary.map((s) => s.overall));
  const totalExpected = summary.reduce((sum, s) => sum + s.expected, 0);
  const totalResponded = summary.reduce((sum, s) => sum + s.responded, 0);
  const responseRate = totalExpected === 0 ? null : Math.round((totalResponded / totalExpected) * 100);

  return (
    <>
      <div className="mb-2">
        <Badge tone="brand">
          <Route className="h-3.5 w-3.5" aria-hidden />
          Itinerario de Automatización y Digitalización
        </Badge>
      </div>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <BarChart3 className="h-5 w-5" style={{ color: "var(--brand)" }} aria-hidden />
            Dashboard Partner 360°
          </span>
        }
        subtitle="Visión agregada de la relación con partners, por periodo."
        actions={
          <DashboardFilters
            periods={periods}
            technologies={technologies}
            selectedPeriodId={selectedPeriod.id}
            selectedTechArea={selectedTechArea}
            selectedTechnologyId={selectedTechnologyId}
          />
        }
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
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-medium text-text-primary">Partners</h2>
            {selectedTechArea !== "ALL" && <Badge tone="brand">{TECH_AREA_LABEL[selectedTechArea]}</Badge>}
            {selectedTechnologyId !== "ALL" && (
              <Badge tone="brand">{technologies.find((t) => t.id === selectedTechnologyId)?.name}</Badge>
            )}
          </div>
          <div className="text-xs text-text-muted">
            Pesos: {categories.map((c) => `${c.code} ${c.weight}%`).join(" · ")}
          </div>
        </div>
        {summary.length === 0 ? (
          <EmptyState>
            {selectedTechArea === "ALL" && selectedTechnologyId === "ALL"
              ? "No hay partners activos todavía."
              : "No hay partners activos que cumplan los filtros seleccionados."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-[var(--border)]">
                  <th className="py-2 font-medium">Partner</th>
                  <th className="py-2 font-medium">Categoría</th>
                  <th className="py-2 font-medium">Tecnología</th>
                  <th className="py-2 font-medium">Puntuación global</th>
                  <th className="py-2 font-medium">Respuestas</th>
                  <th className="py-2 font-medium">Legal</th>
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
                        <Badge>{CATEGORY_LABEL[p.category]}</Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.techAreas.map((a) => (
                            <Badge key={a} tone="brand">
                              {TECH_AREA_LABEL[a]}
                            </Badge>
                          ))}
                          {p.technologies.length === 0 ? (
                            <span className="text-text-muted text-xs">—</span>
                          ) : (
                            p.technologies.map((t) => <Badge key={t}>{t}</Badge>)
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <ScoreBadge score={p.overall} />
                      </td>
                      <td className="py-3 text-text-secondary">
                        {p.responded} / {p.expected}
                      </td>
                      <td className="py-3">
                        {p.expiringDocsCount > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium"
                            style={{ color: "var(--status-critical)" }}
                            title={`${p.expiringDocsCount} documento${p.expiringDocsCount === 1 ? "" : "s"} legal${p.expiringDocsCount === 1 ? "" : "es"} por vencer o vencido${p.expiringDocsCount === 1 ? "" : "s"} en menos de 6 meses`}
                          >
                            <AlertTriangle size={14} aria-hidden />
                            {p.expiringDocsCount}
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
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
