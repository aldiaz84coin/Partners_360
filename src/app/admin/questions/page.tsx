import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { toggleQuestionActiveAction } from "@/lib/actions/questions";

const SCOPE_LABEL: Record<string, string> = { CORE: "Core", STRATEGIC: "Estratégica", SPECIFIC: "Específica" };

export default async function AdminQuestionsPage() {
  const questions = await prisma.question.findMany({
    include: { category: true, audiences: true },
    orderBy: [{ category: { order: "asc" } }, { scope: "asc" }, { order: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Preguntas"
        subtitle="Cuestionario Partner 360°: preguntas core, estratégicas y específicas por stakeholder."
        actions={
          <Link href="/admin/questions/new" className="btn btn-primary text-sm">
            Nueva pregunta
          </Link>
        }
      />

      <Card>
        {questions.length === 0 ? (
          <EmptyState>No hay preguntas todavía.</EmptyState>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {questions.map((q) => (
              <li key={q.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/admin/questions/${q.id}`} className="font-medium text-text-primary hover:underline">
                      {q.code}
                    </Link>
                    <Badge>{q.category.code}</Badge>
                    <Badge>{SCOPE_LABEL[q.scope]}</Badge>
                    <span className="text-xs text-text-muted">{q.audiences.length} roles</span>
                    {!q.active && <Badge>Inactiva</Badge>}
                  </div>
                  <div className="text-sm text-text-secondary mt-0.5 max-w-2xl">{q.text}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/admin/questions/${q.id}`} className="btn btn-secondary text-sm">
                    Editar
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await toggleQuestionActiveAction(q.id, !q.active);
                    }}
                  >
                    <button type="submit" className="btn btn-ghost text-sm">
                      {q.active ? "Desactivar" : "Reactivar"}
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
