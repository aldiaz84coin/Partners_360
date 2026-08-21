import Link from "next/link";
import { Rocket } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { getCampaignExecution, summarizeCampaign, type CampaignRowStatus } from "@/lib/campaign-data";
import { ROLE_LABEL } from "@/lib/chart-colors";
import { CampaignFilters } from "./campaign-filters";

const STATUS_LABEL: Record<CampaignRowStatus, { label: string; tone: "neutral" | "brand" }> = {
  PENDING: { label: "Pendiente", tone: "neutral" },
  DRAFT: { label: "Borrador", tone: "brand" },
  SUBMITTED: { label: "Enviada", tone: "brand" },
};

const NewCampaignButton = (
  <Link href="/admin/campaigns/new" className="btn btn-primary text-sm">
    <Rocket size={15} className="mr-1.5 inline" />
    Nueva Campaña de Evaluación
  </Link>
);

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; status?: string; partner?: string }>;
}) {
  const periods = await prisma.period.findMany({ orderBy: { startDate: "desc" } });

  if (periods.length === 0) {
    return (
      <>
        <PageHeader
          title="Campañas"
          subtitle="Grado de ejecución de las evaluaciones enviadas."
          actions={NewCampaignButton}
        />
        <Card>
          <EmptyState>Todavía no hay periodos creados. Lanza tu primera campaña para empezar.</EmptyState>
        </Card>
      </>
    );
  }

  const { period: periodParam, status: statusParam, partner: partnerParam } = await searchParams;
  const selectedPeriod =
    periods.find((p) => p.id === periodParam) ?? periods.find((p) => p.status === "OPEN") ?? periods[0];

  const rows = await getCampaignExecution(selectedPeriod.id);
  const summary = summarizeCampaign(rows);

  const partnersInRows = Array.from(new Map(rows.map((r) => [r.partnerId, r.partnerName])).entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, name]) => ({ id, name }));

  const selectedStatus =
    statusParam && ["PENDING", "DRAFT", "SUBMITTED"].includes(statusParam) ? (statusParam as CampaignRowStatus) : "ALL";
  const selectedPartnerId =
    partnerParam && partnersInRows.some((p) => p.id === partnerParam) ? partnerParam : "ALL";

  const filteredRows = rows.filter(
    (r) =>
      (selectedStatus === "ALL" || r.status === selectedStatus) &&
      (selectedPartnerId === "ALL" || r.partnerId === selectedPartnerId)
  );

  return (
    <>
      <PageHeader
        title="Campañas"
        subtitle="Grado de ejecución de las evaluaciones: enviadas, respondidas, pendientes y por quién."
        actions={NewCampaignButton}
      />

      <div className="mb-4">
        <CampaignFilters
          periods={periods}
          partners={partnersInRows}
          selectedPeriodId={selectedPeriod.id}
          selectedStatus={selectedStatus}
          selectedPartnerId={selectedPartnerId}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Total esperadas</div>
          <div className="mt-2 text-2xl font-semibold text-text-primary">{summary.total}</div>
        </Card>
        <Card>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Enviadas</div>
          <div className="mt-2 text-2xl font-semibold" style={{ color: "var(--status-good)" }}>
            {summary.submitted}
          </div>
        </Card>
        <Card>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Borrador / Pendientes</div>
          <div className="mt-2 text-2xl font-semibold text-text-primary">
            {summary.draft} / {summary.pending}
          </div>
        </Card>
        <Card>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Tasa de respuesta</div>
          <div className="mt-2 text-2xl font-semibold text-text-primary">
            {summary.responseRate === null ? "—" : `${summary.responseRate}%`}
          </div>
        </Card>
      </div>

      <Card>
        {filteredRows.length === 0 ? (
          <EmptyState>No hay evaluaciones que cumplan los filtros seleccionados.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-[var(--border)]">
                  <th className="py-2 font-medium">Partner</th>
                  <th className="py-2 font-medium">Rol</th>
                  <th className="py-2 font-medium">Evaluador</th>
                  <th className="py-2 font-medium">Estado</th>
                  <th className="py-2 font-medium">Enviada el</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => {
                  const status = STATUS_LABEL[r.status];
                  return (
                    <tr
                      key={`${r.partnerId}-${r.userId}-${r.stakeholderRole}`}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="py-3 font-medium text-text-primary">{r.partnerName}</td>
                      <td className="py-3 text-text-secondary">{ROLE_LABEL[r.stakeholderRole]}</td>
                      <td className="py-3 text-text-secondary">
                        <div>{r.userName}</div>
                        <div className="text-xs text-text-muted">{r.userEmail}</div>
                      </td>
                      <td className="py-3">
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </td>
                      <td className="py-3 text-text-secondary">
                        {r.submittedAt ? r.submittedAt.toLocaleDateString("es-ES") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
