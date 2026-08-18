import { requireUser } from "@/lib/auth";
import { AppNav } from "@/components/nav";
import { PageHeader, Card, EmptyState, Badge } from "@/components/ui";
import { getMyPendingWork, getMyHistory } from "@/lib/evaluations-data";
import { startEvaluationAction } from "@/lib/actions/evaluations";
import Link from "next/link";

const ROLE_LABEL: Record<string, string> = {
  PRO: "Producto",
  VEN: "Ventas",
  PRE: "Ing. Preventa",
  DEL: "Delivery",
  OPS: "Operaciones",
  OWN: "Partner Owner",
};

const STATUS_LABEL: Record<string, { label: string; tone: "neutral" | "brand" }> = {
  PENDING: { label: "Pendiente", tone: "neutral" },
  DRAFT: { label: "Borrador", tone: "brand" },
  SUBMITTED: { label: "Enviada", tone: "brand" },
};

export default async function EvaluatePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; submitted?: string }>;
}) {
  const user = await requireUser();
  const [pending, history] = await Promise.all([getMyPendingWork(user.id), getMyHistory(user.id)]);
  const { saved, submitted } = await searchParams;

  const outstanding = pending.filter((p) => p.status !== "SUBMITTED");

  return (
    <div className="flex flex-col flex-1">
      <AppNav user={user} />
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        <PageHeader
          title="Mis evaluaciones"
          subtitle="Cuestionarios Partner 360° asignados a ti para el periodo abierto."
        />

        {submitted && (
          <div className="mb-4 rounded-lg border border-[var(--border)] bg-surface p-3 text-sm text-[var(--status-good)]">
            Evaluación enviada correctamente. ¡Gracias!
          </div>
        )}
        {saved && !submitted && (
          <div className="mb-4 rounded-lg border border-[var(--border)] bg-surface p-3 text-sm text-text-secondary">
            Borrador guardado.
          </div>
        )}

        <Card className="mb-6">
          <h2 className="font-medium text-text-primary mb-4">Pendientes</h2>
          {outstanding.length === 0 ? (
            <EmptyState>No tienes evaluaciones pendientes ahora mismo.</EmptyState>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {outstanding.map((row) => {
                const status = STATUS_LABEL[row.status];
                return (
                  <li
                    key={`${row.partnerId}-${row.periodId}-${row.stakeholderRole}`}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium text-text-primary">{row.partnerName}</div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {row.periodLabel} · Rol: {ROLE_LABEL[row.stakeholderRole]}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                      <form action={startEvaluationAction}>
                        <input type="hidden" name="partnerId" value={row.partnerId} />
                        <input type="hidden" name="periodId" value={row.periodId} />
                        <input type="hidden" name="stakeholderRole" value={row.stakeholderRole} />
                        <button type="submit" className="btn btn-primary text-sm">
                          {row.status === "DRAFT" ? "Continuar" : "Responder"}
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-medium text-text-primary mb-4">Historial de evaluaciones enviadas</h2>
          {history.length === 0 ? (
            <EmptyState>Aún no has enviado ninguna evaluación.</EmptyState>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {history.map((ev) => (
                <li key={ev.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-text-primary">{ev.partner.name}</div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {ev.period.label} · Rol: {ROLE_LABEL[ev.stakeholderRole]} · Enviada el{" "}
                      {ev.submittedAt?.toLocaleDateString("es-ES")}
                    </div>
                  </div>
                  <Link
                    href={`/evaluate/${ev.partnerId}/${ev.periodId}/${ev.stakeholderRole}`}
                    className="btn btn-secondary text-sm"
                  >
                    Ver
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}
