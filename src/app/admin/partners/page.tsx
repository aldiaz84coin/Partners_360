import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { togglePartnerActiveAction, deletePartnerAction } from "@/lib/actions/partners";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { getExpiringLegalDocs } from "@/lib/partner-legal";

const CATEGORY_LABEL: Record<string, string> = {
  ESTRATEGICO: "Estratégico",
  ESTANDAR: "Estandard",
  EN_EVALUACION: "En Evaluación",
};

const TECH_AREA_LABEL: Record<string, string> = {
  AUTOMATIZACION: "Automatización",
  DIGITALIZACION: "Digitalización",
};

export default async function AdminPartnersPage() {
  const partners = await prisma.partner.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { assignments: { where: { active: true } } } } },
  });

  return (
    <>
      <PageHeader
        title="Partners"
        subtitle="Empresas partner evaluadas en el marco Partner 360°."
        actions={
          <Link href="/admin/partners/new" className="btn btn-primary text-sm">
            Nuevo partner
          </Link>
        }
      />

      <Card>
        {partners.length === 0 ? (
          <EmptyState>Todavía no hay partners.</EmptyState>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {partners.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/admin/partners/${p.id}`} className="font-medium text-text-primary hover:underline">
                      {p.name}
                    </Link>
                    <Badge>{CATEGORY_LABEL[p.category]}</Badge>
                    {p.techAreas.map((a) => (
                      <Badge key={a}>{TECH_AREA_LABEL[a]}</Badge>
                    ))}
                    {!p.active && <Badge>Archivado</Badge>}
                    {(() => {
                      const expiringDocs = getExpiringLegalDocs(p);
                      if (expiringDocs.length === 0) return null;
                      return (
                        <span
                          className="badge inline-flex items-center gap-1"
                          style={{ background: "#d03b3b1a", color: "var(--status-critical)" }}
                          title={expiringDocs
                            .map((d) => `${d.label}: ${d.expired ? "vencido" : "vence"} ${d.endDate.toLocaleDateString("es-ES")}`)
                            .join(" · ")}
                        >
                          <AlertTriangle size={12} aria-hidden />
                          {expiringDocs.length} documento{expiringDocs.length === 1 ? "" : "s"} por vencer
                        </span>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {p.description || "Sin descripción"} · {p._count.assignments} evaluadores asignados
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/admin/partners/${p.id}`} className="btn btn-secondary text-sm">
                    Gestionar
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await togglePartnerActiveAction(p.id, !p.active);
                    }}
                  >
                    <button type="submit" className="btn btn-ghost text-sm">
                      {p.active ? "Archivar" : "Reactivar"}
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await deletePartnerAction(p.id);
                    }}
                  >
                    <ConfirmSubmitButton
                      confirmText={`¿Eliminar el partner "${p.name}"? Se borrarán también sus evaluadores asignados y todas sus evaluaciones (${p._count.assignments} evaluadores). Esta acción no se puede deshacer.`}
                    >
                      Eliminar
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
