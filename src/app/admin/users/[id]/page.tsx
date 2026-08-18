import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/chart-colors";
import { EditUserForm, ResetPasswordForm } from "./edit-user-form";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { assignments: { include: { partner: true }, where: { active: true } } },
  });
  if (!user) notFound();

  return (
    <>
      <PageHeader title={user.name} subtitle={user.email} />

      <Card className="mb-6">
        <h2 className="font-medium text-text-primary mb-3">Datos de usuario</h2>
        <EditUserForm userId={user.id} name={user.name} systemRole={user.systemRole} />
      </Card>

      <Card className="mb-6">
        <h2 className="font-medium text-text-primary mb-3">Restablecer contraseña</h2>
        <ResetPasswordForm userId={user.id} />
      </Card>

      <Card>
        <h2 className="font-medium text-text-primary mb-3">Partners asignados</h2>
        {user.assignments.length === 0 ? (
          <EmptyState>Sin asignaciones. Añádelas desde la ficha de cada partner.</EmptyState>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {user.assignments.map((a) => (
              <li key={a.id} className="py-2 text-sm">
                <span className="font-medium text-text-primary">{a.partner.name}</span>
                <span className="text-text-muted"> · Rol: {ROLE_LABEL[a.stakeholderRole]}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
