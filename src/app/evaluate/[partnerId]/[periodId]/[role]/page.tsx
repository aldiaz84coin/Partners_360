import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/nav";
import { PageHeader, Badge } from "@/components/ui";
import { getQuestionsForRole, getOrCreateEvaluation } from "@/lib/evaluations-data";
import { saveAnswersAction } from "@/lib/actions/evaluations";
import { SubmitBar } from "./submit-bar";
import type { StakeholderRole } from "@/generated/prisma/enums";

const ROLE_LABEL: Record<string, string> = {
  PRO: "Producto",
  VEN: "Ventas",
  PRE: "Ingeniería Preventa",
  DEL: "Delivery",
  OPS: "Operaciones / Soporte",
  OWN: "Partner Owner",
};

const SCOPE_LABEL: Record<string, string> = {
  CORE: "General",
  STRATEGIC: "Estratégica",
  SPECIFIC: "Tu especialidad",
};

const SCALE = [
  { value: "5", label: "5 · Excelente" },
  { value: "4", label: "4 · Bueno" },
  { value: "3", label: "3 · Adecuado" },
  { value: "2", label: "2 · Deficiente" },
  { value: "1", label: "1 · Muy deficiente" },
  { value: "NA", label: "N/A · Sin información suficiente" },
];

const VALID_ROLES = ["PRO", "VEN", "PRE", "DEL", "OPS", "OWN"];

export default async function EvaluationFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ partnerId: string; periodId: string; role: string }>;
  searchParams: Promise<{ missing?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const { partnerId, periodId, role } = await params;
  const { missing, saved } = await searchParams;

  if (!VALID_ROLES.includes(role)) notFound();
  const stakeholderRole = role as StakeholderRole;

  const [assignment, partner, period] = await Promise.all([
    prisma.partnerAssignment.findUnique({
      where: { partnerId_userId_stakeholderRole: { partnerId, userId: user.id, stakeholderRole } },
    }),
    prisma.partner.findUnique({ where: { id: partnerId } }),
    prisma.period.findUnique({ where: { id: periodId } }),
  ]);

  if (!assignment || !assignment.active || !partner || !period) notFound();
  if (user.systemRole !== "ADMIN" && assignment.userId !== user.id) notFound();

  const evaluation = await getOrCreateEvaluation(partnerId, periodId, user.id, stakeholderRole);
  const readOnly = evaluation.status === "SUBMITTED" || period.status === "CLOSED";

  if (period.status === "CLOSED" && evaluation.status !== "SUBMITTED") {
    // Nothing was ever submitted and the window is closed — nothing to edit or show meaningfully.
    redirect("/evaluate");
  }

  const [questions, answers] = await Promise.all([
    getQuestionsForRole(stakeholderRole),
    prisma.answer.findMany({ where: { evaluationId: evaluation.id } }),
  ]);
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));

  const grouped = new Map<string, { name: string; questions: typeof questions }>();
  for (const q of questions) {
    const g = grouped.get(q.category.code) ?? { name: q.category.name, questions: [] };
    g.questions.push(q);
    grouped.set(q.category.code, g);
  }

  const missingCodes = new Set((missing ?? "").split(",").filter(Boolean));

  return (
    <div className="flex flex-col flex-1">
      <AppNav user={user} />
      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 pb-28">
        <PageHeader
          title={partner.name}
          subtitle={`${period.label} · Evaluando como ${ROLE_LABEL[stakeholderRole]}`}
          actions={
            readOnly ? (
              <Badge tone="brand">{evaluation.status === "SUBMITTED" ? "Enviada" : "Periodo cerrado"}</Badge>
            ) : undefined
          }
        />

        {saved && !readOnly && (
          <div className="mb-4 rounded-lg border border-[var(--border)] bg-surface p-3 text-sm text-text-secondary">
            Borrador guardado.
          </div>
        )}
        {missingCodes.size > 0 && (
          <div className="mb-4 rounded-lg border border-[var(--status-critical)]/30 bg-surface p-3 text-sm text-[var(--status-critical)]">
            Faltan respuestas obligatorias antes de poder enviar: {Array.from(missingCodes).join(", ")}
          </div>
        )}

        <form action={saveAnswersAction.bind(null, evaluation.id)} className="flex flex-col gap-8">
          {Array.from(grouped.entries()).map(([code, group]) => (
            <section key={code}>
              <h2 className="font-semibold text-text-primary mb-3">{group.name}</h2>
              <div className="flex flex-col gap-5">
                {group.questions.map((q) => {
                  const existing = answerMap.get(q.questionId);
                  const currentValue = existing ? (existing.isNA ? "NA" : String(existing.value)) : undefined;
                  return (
                    <fieldset key={q.questionId} className="card p-4" disabled={readOnly}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <legend className="text-sm font-medium text-text-primary">{q.text}</legend>
                        <div className="flex gap-1 shrink-0">
                          <Badge>{SCOPE_LABEL[q.scope]}</Badge>
                          {!q.required && <Badge>Opcional</Badge>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {SCALE.map((opt) => (
                          <label
                            key={opt.value}
                            className="flex items-center gap-1.5 text-sm text-text-secondary cursor-pointer"
                          >
                            <input
                              type="radio"
                              name={`q_${q.questionId}`}
                              value={opt.value}
                              defaultChecked={currentValue === opt.value}
                              className="accent-[var(--brand)]"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            </section>
          ))}

          <section>
            <h2 className="font-semibold text-text-primary mb-3">Observaciones</h2>
            <textarea
              name="comment"
              rows={4}
              disabled={readOnly}
              defaultValue={evaluation.comment ?? ""}
              placeholder="Comentarios adicionales sobre este partner en el periodo (opcional)."
              className="input"
            />
          </section>

          {!readOnly && <SubmitBar />}
        </form>
      </main>
    </div>
  );
}
