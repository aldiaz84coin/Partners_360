import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, Badge, Card } from "@/components/ui";
import { getQuestionsForRole } from "@/lib/evaluations-data";
import type { StakeholderRole } from "@/generated/prisma/enums";

const ROLE_LABEL: Record<string, string> = {
  PRO: "Producto",
  VEN: "Ventas",
  PRE: "Ingeniería Preventa",
  DEL: "Delivery",
  OPS: "Operaciones / Soporte",
  OWN: "Partner Owner",
};

const SCOPE_LABEL: Record<string, string> = { CORE: "General", STRATEGIC: "Estratégica", SPECIFIC: "Tu especialidad" };

const SCALE = [
  { label: "5 · Excelente" },
  { label: "4 · Bueno" },
  { label: "3 · Adecuado" },
  { label: "2 · Deficiente" },
  { label: "1 · Muy deficiente" },
  { label: "N/A · Sin información suficiente" },
];

const VALID_ROLES = ["PRO", "VEN", "PRE", "DEL", "OPS", "OWN"];

export default async function QuestionPreviewPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (!VALID_ROLES.includes(role)) notFound();
  const stakeholderRole = role as StakeholderRole;

  const questions = await getQuestionsForRole(stakeholderRole);

  const grouped = new Map<string, { name: string; questions: typeof questions }>();
  for (const q of questions) {
    const g = grouped.get(q.category.code) ?? { name: q.category.name, questions: [] };
    g.questions.push(q);
    grouped.set(q.category.code, g);
  }

  return (
    <>
      <PageHeader
        title={`Vista previa · ${ROLE_LABEL[stakeholderRole]}`}
        subtitle={`Así vería este stakeholder su formulario: ${questions.length} pregunta${
          questions.length === 1 ? "" : "s"
        } con la configuración actual.`}
        actions={
          <Link href="/admin/questions" className="btn btn-secondary text-sm">
            Volver a preguntas
          </Link>
        }
      />

      {questions.length === 0 ? (
        <Card>
          <p className="text-sm text-text-muted">Este rol no tiene ninguna pregunta activa asignada todavía.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {Array.from(grouped.entries()).map(([code, group]) => (
            <section key={code}>
              <h2 className="font-semibold text-text-primary mb-3">{group.name}</h2>
              <div className="flex flex-col gap-5">
                {group.questions.map((q) => (
                  <fieldset key={q.questionId} className="card p-4" disabled>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <legend className="text-sm font-medium text-text-primary">{q.text}</legend>
                      <div className="flex gap-1 shrink-0">
                        <Badge>{SCOPE_LABEL[q.scope]}</Badge>
                        {!q.required && <Badge>Opcional</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {SCALE.map((opt) => (
                        <label key={opt.label} className="flex items-center gap-1.5 text-sm text-text-muted">
                          <input type="radio" disabled className="accent-[var(--brand)]" />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
