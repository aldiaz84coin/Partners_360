import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { toggleUserActiveAction } from "@/lib/actions/users";
import { NewUserForm } from "./new-user-form";

const ROLE_LABEL: Record<string, string> = { ADMIN: "Administrador", VIEWER: "Lectura", EVALUATOR: "Evaluador" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <PageHeader title="Stakeholders y usuarios" subtitle="Personas con acceso a la app: evaluadores, lectores y administradores." />

      <Card className="mb-6">
        <h2 className="font-medium text-text-primary mb-3">Nuevo usuario</h2>
        <NewUserForm />
      </Card>

      <Card>
        {users.length === 0 ? (
          <EmptyState>No hay usuarios.</EmptyState>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {users.map((u) => (
              <li key={u.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-text-primary hover:underline">
                      {u.name}
                    </Link>
                    <Badge>{ROLE_LABEL[u.systemRole]}</Badge>
                    {!u.active && <Badge>Inactivo</Badge>}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">{u.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/users/${u.id}`} className="btn btn-secondary text-sm">
                    Editar
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await toggleUserActiveAction(u.id, !u.active);
                    }}
                  >
                    <button type="submit" className="btn btn-ghost text-sm">
                      {u.active ? "Desactivar" : "Reactivar"}
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
