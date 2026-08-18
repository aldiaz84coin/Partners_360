import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { toggleAssignmentAction } from "@/lib/actions/partners";
import { ROLE_LABEL } from "@/lib/chart-colors";
import { EditPartnerForm } from "./edit-partner-form";
import { AddAssignmentForm } from "./add-assignment-form";

export default async function AdminPartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: { assignments: { include: { user: true }, orderBy: { stakeholderRole: "asc" } } },
  });
  if (!partner) notFound();

  const users = await prisma.user.findMany({
    where: { active: true, systemRole: "EVALUATOR" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <>
      <PageHeader title={partner.name} subtitle="Ficha del partner y evaluadores asignados." />

      <Card className="mb-6">
        <h2 className="font-medium text-text-primary mb-3">Datos del partner</h2>
        <EditPartnerForm partnerId={partner.id} name={partner.name} description={partner.description ?? ""} />
      </Card>

      <Card className="mb-6">
        <h2 className="font-medium text-text-primary mb-3">Añadir evaluador</h2>
        <AddAssignmentForm partnerId={partner.id} users={users} />
      </Card>

      <Card>
        <h2 className="font-medium text-text-primary mb-4">Evaluadores asignados</h2>
        {partner.assignments.length === 0 ? (
          <EmptyState>Todavía no hay evaluadores asignados a este partner.</EmptyState>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {partner.assignments.map((a) => (
              <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-text-primary">{a.user.name}</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {a.user.email} · Rol: {ROLE_LABEL[a.stakeholderRole]}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!a.active && <Badge>Inactivo</Badge>}
                  <form
                    action={async () => {
                      "use server";
                      await toggleAssignmentAction(a.id, partner.id, !a.active);
                    }}
                  >
                    <button type="submit" className="btn btn-ghost text-sm">
                      {a.active ? "Desactivar" : "Reactivar"}
                    </button>
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
