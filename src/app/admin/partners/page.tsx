import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { togglePartnerActiveAction } from "@/lib/actions/partners";
import { NewPartnerForm } from "./new-partner-form";

export default async function AdminPartnersPage() {
  const partners = await prisma.partner.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { assignments: { where: { active: true } } } } },
  });

  return (
    <>
      <PageHeader title="Partners" subtitle="Empresas partner evaluadas en el marco Partner 360°." />

      <Card className="mb-6">
        <h2 className="font-medium text-text-primary mb-3">Nuevo partner</h2>
        <NewPartnerForm />
      </Card>

      <Card>
        {partners.length === 0 ? (
          <EmptyState>Todavía no hay partners.</EmptyState>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {partners.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/partners/${p.id}`} className="font-medium text-text-primary hover:underline">
                      {p.name}
                    </Link>
                    {!p.active && <Badge>Archivado</Badge>}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {p.description || "Sin descripción"} · {p._count.assignments} evaluadores asignados
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
