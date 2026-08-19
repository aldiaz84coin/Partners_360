import { Route } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/nav";
import { PageHeader, Card, Badge } from "@/components/ui";
import { CATEGORY_COLORS, ROLE_COLORS, ROLE_LABEL } from "@/lib/chart-colors";

const OBJECTIVES = [
  "Desempeño",
  "Calidad de la relación",
  "Valor para el negocio",
  "Innovación y alineamiento",
  "Riesgo",
  "Diferencias de percepción entre stakeholders",
  "Evolución en el tiempo",
  "Acciones de mejora",
];

const STAKEHOLDERS: { code: string; perspective: string }[] = [
  { code: "PRO", perspective: "Producto, tecnología, roadmap, innovación" },
  { code: "VEN", perspective: "Negocio, oportunidades, competitividad" },
  { code: "PRE", perspective: "Viabilidad, solución, PoC, documentación técnica" },
  { code: "DEL", perspective: "Implantación, calidad y cumplimiento" },
  { code: "OPS", perspective: "SLA, incidencias, soporte y continuidad" },
  { code: "OWN", perspective: "Relación global, estrategia y evolución" },
];

const CATEGORY_DETAIL: Record<string, { title: string; blurb: string; aspects: string[] }> = {
  REL: {
    title: "Relationship & Collaboration",
    blurb: "La salud de la relación día a día.",
    aspects: ["Comunicación", "Proactividad", "Transparencia", "Confianza", "Resolución de conflictos", "Adaptabilidad"],
  },
  PER: {
    title: "Performance & Delivery",
    blurb: "El cumplimiento de lo comprometido.",
    aspects: ["Calidad", "Plazos", "SLA", "Capacidad de respuesta", "Cumplimiento de compromisos", "Resolución de problemas"],
  },
  BUS: {
    title: "Business Value",
    blurb: "El valor generado para el negocio.",
    aspects: ["Generación de oportunidades", "Valor para el cliente", "Competitividad", "Coste/valor", "Time-to-market", "Contribución al negocio"],
  },
  INN: {
    title: "Innovation & Strategic Alignment",
    blurb: "El potencial estratégico a futuro.",
    aspects: ["Roadmap tecnológico", "Nuevas capacidades", "Innovación", "Co-innovación", "Diferenciación", "Alineamiento estratégico"],
  },
  RSK: {
    title: "Risk & Governance",
    blurb: "La exposición al riesgo de la relación.",
    aspects: ["Compliance", "Cumplimiento contractual", "Dependencia", "Continuidad", "Seguridad", "Riesgos técnicos/operativos"],
  },
};

const SCALE = [
  { value: 5, label: "Excelente", score: 100 },
  { value: 4, label: "Bueno", score: 75 },
  { value: 3, label: "Adecuado", score: 50 },
  { value: 2, label: "Deficiente", score: 25 },
  { value: 1, label: "Muy deficiente", score: 0 },
];

const STEPS = [
  {
    title: "Se abre un periodo",
    body: "Un administrador crea y abre un periodo de evaluación, trimestral por defecto, desde Administración → Periodos.",
  },
  {
    title: "Cada stakeholder recibe su cuestionario",
    body: "Los evaluadores asignados a cada partner ven sus evaluaciones pendientes en “Mis evaluaciones”, ya filtradas a las preguntas que les corresponden.",
  },
  {
    title: "Se responde por partner, rol y periodo",
    body: "12 preguntas Core + 3 Estratégicas (comunes a todos) más 4 específicas del rol, en escala 1-5 o N/A. Se puede guardar como borrador y continuar más tarde.",
  },
  {
    title: "El envío fija la respuesta",
    body: "Al enviar, la evaluación queda cerrada para ese partner, rol y periodo — no se puede editar después, igual que un formulario tradicional.",
  },
  {
    title: "El dashboard agrega los resultados",
    body: "Las respuestas se normalizan a escala 0-100 y se agregan por categoría, por stakeholder (para ver diferencias de percepción) y a lo largo del tiempo.",
  },
];

export default async function MetodologiaPage() {
  const user = await requireUser();
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="flex flex-col flex-1">
      <AppNav user={user} />
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex-1">
        <div className="mb-2">
          <Badge tone="brand">
            <Route className="h-3.5 w-3.5" aria-hidden />
            Itinerario de Automatización y Digitalización
          </Badge>
        </div>
        <PageHeader
          title="Metodología Partner 360°"
          subtitle="Cómo evaluamos y gestionamos la relación con partners tecnológicos, y qué significa cada dimensión."
        />

        {/* Objetivo */}
        <Card className="mb-6">
          <h2 className="font-semibold text-text-primary mb-2">Objetivo</h2>
          <p className="text-sm text-text-secondary mb-4">
            No buscamos únicamente medir si un partner &ldquo;funciona bien&rdquo;, sino obtener una
            visión completa de la relación — inspirada en los principios de gestión de relaciones
            colaborativas de <span className="font-medium text-text-primary">ISO 44001</span>.
          </p>
          <div className="flex flex-wrap gap-2">
            {OBJECTIVES.map((o) => (
              <Badge key={o}>{o}</Badge>
            ))}
          </div>
        </Card>

        {/* Unidad de análisis */}
        <Card className="mb-6">
          <h2 className="font-semibold text-text-primary mb-3">Unidad de análisis</h2>
          <div className="flex flex-wrap items-center gap-3 text-lg font-semibold text-text-primary">
            <span className="rounded-lg bg-surface-2 border border-[var(--border)] px-4 py-2">Partner</span>
            <span className="text-text-muted text-base">×</span>
            <span className="rounded-lg bg-surface-2 border border-[var(--border)] px-4 py-2">Stakeholder</span>
            <span className="text-text-muted text-base">×</span>
            <span className="rounded-lg bg-surface-2 border border-[var(--border)] px-4 py-2">Periodo</span>
          </div>
          <p className="text-sm text-text-secondary mt-3">
            Cada evaluación es la opinión de un stakeholder concreto, sobre un partner concreto, en un
            periodo concreto. Esto es lo que permite comparar cómo distintos perfiles perciben al mismo
            partner, y cómo evoluciona esa percepción trimestre a trimestre.
          </p>
        </Card>

        {/* Stakeholders */}
        <Card className="mb-6">
          <h2 className="font-semibold text-text-primary mb-1">Los seis stakeholders</h2>
          <p className="text-sm text-text-secondary mb-4">
            Seis perfiles evalúan al partner, cada uno desde su propia perspectiva. Partner Owner aporta
            una visión transversal de la relación, no solo operativa.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STAKEHOLDERS.map((s) => (
              <div key={s.code} className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3">
                <span
                  className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: ROLE_COLORS[s.code] }}
                  aria-hidden
                />
                <div>
                  <div className="text-sm font-medium text-text-primary">{ROLE_LABEL[s.code]}</div>
                  <div className="text-xs text-text-muted mt-0.5">{s.perspective}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Categorías */}
        <Card className="mb-6">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="font-semibold text-text-primary">Las cinco dimensiones de evaluación</h2>
            <Badge>Pesos suman {totalWeight}%</Badge>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Cada categoría contribuye a la puntuación global del partner según su peso. Los pesos son
            configurables desde Administración → Categorías.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((c) => {
              const detail = CATEGORY_DETAIL[c.code];
              const color = CATEGORY_COLORS[c.code] ?? "var(--text-muted)";
              return (
                <div key={c.id} className="rounded-lg border border-[var(--border)] overflow-hidden">
                  <div className="h-1" style={{ background: color }} aria-hidden />
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <Badge>{c.code}</Badge>
                        <span className="text-sm font-medium text-text-primary">
                          {detail?.title ?? c.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-text-primary">{c.weight}%</span>
                    </div>
                    {detail && <p className="text-xs text-text-muted mb-2">{detail.blurb}</p>}
                    {detail && (
                      <ul className="text-xs text-text-secondary space-y-0.5">
                        {detail.aspects.map((a) => (
                          <li key={a} className="flex items-center gap-1.5">
                            <span
                              className="h-1 w-1 rounded-full shrink-0"
                              style={{ background: color }}
                              aria-hidden
                            />
                            {a}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Estructura del cuestionario */}
        <Card className="mb-6">
          <h2 className="font-semibold text-text-primary mb-1">Estructura del cuestionario</h2>
          <p className="text-sm text-text-secondary mb-4">
            Cada evaluador responde tres bloques de preguntas por partner y periodo:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="rounded-lg bg-surface-2 p-4 text-center">
              <div className="text-2xl font-semibold text-text-primary">12</div>
              <div className="text-xs font-medium text-text-secondary mt-1">Core</div>
              <div className="text-xs text-text-muted mt-1">Comunes a los 6 stakeholders</div>
            </div>
            <div className="rounded-lg bg-surface-2 p-4 text-center">
              <div className="text-2xl font-semibold text-text-primary">3</div>
              <div className="text-xs font-medium text-text-secondary mt-1">Estratégicas</div>
              <div className="text-xs text-text-muted mt-1">Comunes, visión a 12 meses</div>
            </div>
            <div className="rounded-lg bg-surface-2 p-4 text-center">
              <div className="text-2xl font-semibold text-text-primary">4</div>
              <div className="text-xs font-medium text-text-secondary mt-1">Específicas</div>
              <div className="text-xs text-text-muted mt-1">Solo del rol del evaluador</div>
            </div>
          </div>
          <p className="text-xs text-text-muted">
            ≈19 preguntas por evaluador. No todos los stakeholders evalúan todo: por ejemplo, Business
            Value es opcional para Preventa, Delivery y Operaciones, cuyo foco está en ejecución más que
            en negocio.
          </p>
        </Card>

        {/* Escala */}
        <Card className="mb-6">
          <h2 className="font-semibold text-text-primary mb-1">Escala de evaluación</h2>
          <p className="text-sm text-text-secondary mb-4">
            Todas las preguntas cuantitativas usan la misma escala de 1 a 5, con opción de N/A cuando no
            hay información suficiente. Para los KPIs, cada valor se normaliza a 0-100.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-[var(--border)]">
                  <th className="py-2 font-medium">Valor</th>
                  <th className="py-2 font-medium">Significado</th>
                  <th className="py-2 font-medium">Normalizado</th>
                </tr>
              </thead>
              <tbody>
                {SCALE.map((s) => (
                  <tr key={s.value} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2 font-medium text-text-primary">{s.value}</td>
                    <td className="py-2 text-text-secondary">{s.label}</td>
                    <td className="py-2 text-text-secondary">{s.score}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 font-medium text-text-primary">N/A</td>
                  <td className="py-2 text-text-secondary" colSpan={2}>
                    No tengo suficiente información — se excluye del cálculo, no cuenta como 0.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Cómo se ejecuta */}
        <Card className="mb-6">
          <h2 className="font-semibold text-text-primary mb-4">Cómo se ejecuta, paso a paso</h2>
          <ol className="space-y-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="shrink-0 h-6 w-6 rounded-full bg-surface-2 border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-text-primary">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-medium text-text-primary">{step.title}</div>
                  <div className="text-sm text-text-secondary mt-0.5">{step.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <p className="text-xs text-text-muted text-center pb-6">
          Preguntas, categorías, pesos y periodos son configurables desde Administración.
        </p>
      </main>
    </div>
  );
}
