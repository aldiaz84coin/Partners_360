import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { toggleTechnologyActiveAction, deleteTechnologyAction } from "@/lib/actions/technologies";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { NewTechnologyForm } from "./new-technology-form";

export default async function AdminTechnologiesPage() {
  const technologies = await prisma.technology.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { partners: true } } },
  });

  return (
    <>
      <PageHeader
        title="Tecnologías"
        subtitle="Catálogo de tags que se pueden asignar a un partner (multiselección)."
      />

      <Card className="mb-6">
        <h2 className="font-medium text-text-primary mb-3">Nueva tecnología</h2>
        <NewTechnologyForm />
      </Card>

      <Card>
        {technologies.length === 0 ? (
          <EmptyState>Todavía no hay tecnologías en el catálogo.</EmptyState>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {technologies.map((t) => (
              <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">{t.name}</span>
                  <span className="text-xs text-text-muted">
                    {t._count.partners} partner{t._count.partners === 1 ? "" : "s"}
                  </span>
                  {!t.active && <Badge>Inactiva</Badge>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <form
                    action={async () => {
                      "use server";
                      await toggleTechnologyActiveAction(t.id, !t.active);
                    }}
                  >
                    <button type="submit" className="btn btn-ghost text-sm">
                      {t.active ? "Desactivar" : "Reactivar"}
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await deleteTechnologyAction(t.id);
                    }}
                  >
                    <ConfirmSubmitButton
                      confirmText={`¿Eliminar la tecnología "${t.name}"? Se quitará del catálogo y de todos los partners que la tengan asignada. Esta acción no se puede deshacer.`}
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
