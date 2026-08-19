"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Info, CheckCircle2, ChevronRight, ChevronLeft, Send } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { launchCampaignAction, type CampaignInput, type CampaignResult } from "@/lib/actions/campaigns";

type Period = { id: string; label: string; status: string; startDate: string; endDate: string };
type Partner = { id: string; name: string; category: string; assignedUserIds: string[] };
type Evaluator = { id: string; name: string; email: string; stakeholderRole: string };

const CATEGORY_LABEL: Record<string, string> = {
  ESTRATEGICO: "Estratégico",
  ESTANDAR: "Estándar",
  NUEVO: "Nuevo",
};

const ROLE_LABEL: Record<string, string> = {
  PRO: "Producto",
  VEN: "Ventas",
  PRE: "Ing. Preventa",
  DEL: "Delivery",
  OPS: "Operaciones / Soporte",
  OWN: "Partner Owner",
};

const STEPS = ["Periodo", "Partners", "Stakeholders", "Enviar"] as const;

function Helper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg border border-[var(--border)] bg-surface-2 p-3 text-sm text-text-secondary mb-5">
      <Info size={16} className="shrink-0 mt-0.5 text-[var(--brand)]" />
      <div>{children}</div>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 mb-6 flex-wrap">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
              i === current
                ? "bg-[var(--brand)] text-[var(--brand-ink)]"
                : i < current
                  ? "bg-[#0ca30c1a] text-[var(--status-good)]"
                  : "bg-surface-2 text-text-muted border border-[var(--border)]"
            }`}
          >
            {i < current ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}
            {label}
          </div>
          {i < STEPS.length - 1 && <ChevronRight size={14} className="text-text-muted" />}
        </li>
      ))}
    </ol>
  );
}

export function CampaignWizard({
  periods,
  partners,
  evaluators,
}: {
  periods: Period[];
  partners: Partner[];
  evaluators: Evaluator[];
}) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CampaignResult | null>(null);

  const openPeriod = periods.find((p) => p.status === "OPEN");
  const [periodMode, setPeriodMode] = useState<"existing" | "new">(
    periods.length > 0 ? "existing" : "new"
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState(openPeriod?.id ?? periods[0]?.id ?? "");
  const [newPeriod, setNewPeriod] = useState({ label: "", startDate: "", endDate: "" });

  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [stakeholdersByPartner, setStakeholdersByPartner] = useState<Record<string, string[]>>({});
  const [quickSelection, setQuickSelection] = useState<string[]>(evaluators.map((e) => e.id));

  const evaluatorsByRole = useMemo(() => {
    const groups = new Map<string, Evaluator[]>();
    for (const e of evaluators) {
      const list = groups.get(e.stakeholderRole) ?? [];
      list.push(e);
      groups.set(e.stakeholderRole, list);
    }
    return groups;
  }, [evaluators]);

  const evaluatorById = useMemo(() => new Map(evaluators.map((e) => [e.id, e])), [evaluators]);

  function togglePartner(id: string) {
    setSelectedPartnerIds((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      setStakeholdersByPartner((prevMap) => {
        const copy = { ...prevMap };
        if (!prev.includes(id) && !(id in copy)) {
          const partner = partners.find((p) => p.id === id);
          copy[id] = partner ? partner.assignedUserIds.filter((uid) => evaluatorById.has(uid)) : [];
        }
        return copy;
      });
      return next;
    });
  }

  function toggleStakeholder(partnerId: string, userId: string) {
    setStakeholdersByPartner((prev) => {
      const current = prev[partnerId] ?? [];
      const next = current.includes(userId) ? current.filter((u) => u !== userId) : [...current, userId];
      return { ...prev, [partnerId]: next };
    });
  }

  function applyQuickSelectionToAll() {
    setStakeholdersByPartner((prev) => {
      const copy = { ...prev };
      for (const id of selectedPartnerIds) copy[id] = [...quickSelection];
      return copy;
    });
  }

  const totalStakeholders = selectedPartnerIds.reduce(
    (sum, id) => sum + (stakeholdersByPartner[id]?.length ?? 0),
    0
  );

  const canProceedStep0 =
    periodMode === "existing" ? Boolean(selectedPeriodId) : newPeriod.label.trim().length >= 3 && newPeriod.startDate && newPeriod.endDate;
  const canProceedStep1 = selectedPartnerIds.length > 0;
  const canProceedStep2 = totalStakeholders > 0;

  function handleSubmit() {
    const input: CampaignInput = {
      periodMode,
      periodId: periodMode === "existing" ? selectedPeriodId : undefined,
      newPeriod: periodMode === "new" ? newPeriod : undefined,
      partnerIds: selectedPartnerIds,
      stakeholdersByPartner,
    };
    startTransition(async () => {
      const res = await launchCampaignAction(input);
      setResult(res);
    });
  }

  if (result && "success" in result) {
    return (
      <Card className="max-w-2xl">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="text-[var(--status-good)] shrink-0 mt-0.5" size={22} />
          <div>
            <h2 className="font-medium text-text-primary mb-1">Campaña lanzada correctamente</h2>
            <p className="text-sm text-text-secondary">
              Periodo <strong>{result.periodLabel}</strong> abierto para{" "}
              <strong>{result.partnerCount}</strong> partner{result.partnerCount === 1 ? "" : "s"}. Se han
              activado <strong>{result.assignmentCount}</strong> asignaciones de evaluador — cada stakeholder
              verá la encuesta correspondiente en su sección &quot;Mis evaluaciones&quot;.
            </p>
            <div className="flex gap-3 mt-4">
              <Link href="/admin/periods" className="btn btn-secondary text-sm">
                Ver periodos
              </Link>
              <Link href="/admin" className="btn btn-primary text-sm">
                Volver a administración
              </Link>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl">
      <StepIndicator current={step} />

      {step === 0 && (
        <div>
          <Helper>
            Elige el periodo trimestral que se evaluará en esta campaña. Puedes reutilizar un periodo ya
            creado (si estaba cerrado, se reabrirá automáticamente) o crear uno nuevo aquí mismo.
          </Helper>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              className={`btn text-sm ${periodMode === "existing" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setPeriodMode("existing")}
              disabled={periods.length === 0}
            >
              Usar periodo existente
            </button>
            <button
              type="button"
              className={`btn text-sm ${periodMode === "new" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setPeriodMode("new")}
            >
              Crear periodo nuevo
            </button>
          </div>

          {periodMode === "existing" ? (
            periods.length === 0 ? (
              <p className="text-sm text-text-muted">No hay periodos todavía. Crea uno nuevo para continuar.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {periods.map((p) => (
                  <li key={p.id}>
                    <label
                      className={`flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        selectedPeriodId === p.id
                          ? "border-[var(--brand)] bg-[#184f951a]"
                          : "border-[var(--border)] hover:border-[var(--brand)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="period"
                          checked={selectedPeriodId === p.id}
                          onChange={() => setSelectedPeriodId(p.id)}
                        />
                        <div>
                          <div className="font-medium text-text-primary text-sm">{p.label}</div>
                          <div className="text-xs text-text-muted">
                            {p.startDate} – {p.endDate}
                          </div>
                        </div>
                      </div>
                      <Badge tone={p.status === "OPEN" ? "brand" : undefined}>
                        {p.status === "OPEN" ? "Abierto" : "Cerrado (se reabrirá)"}
                      </Badge>
                    </label>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Etiqueta</label>
                <input
                  className="input w-32"
                  placeholder="2026-Q2"
                  value={newPeriod.label}
                  onChange={(e) => setNewPeriod((s) => ({ ...s, label: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Inicio</label>
                <input
                  type="date"
                  className="input w-auto"
                  value={newPeriod.startDate}
                  onChange={(e) => setNewPeriod((s) => ({ ...s, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Fin</label>
                <input
                  type="date"
                  className="input w-auto"
                  value={newPeriod.endDate}
                  onChange={(e) => setNewPeriod((s) => ({ ...s, endDate: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div>
          <Helper>
            Selecciona los partners que quieres evaluar en esta campaña. Solo se muestran partners activos.
            Podrás elegir a qué stakeholders se les pide evaluar cada uno en el siguiente paso.
          </Helper>
          {partners.length === 0 ? (
            <p className="text-sm text-text-muted">No hay partners activos.</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted">{selectedPartnerIds.length} seleccionados</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost text-xs"
                    onClick={() => partners.forEach((p) => !selectedPartnerIds.includes(p.id) && togglePartner(p.id))}
                  >
                    Seleccionar todos
                  </button>
                  <button type="button" className="btn btn-ghost text-xs" onClick={() => setSelectedPartnerIds([])}>
                    Limpiar
                  </button>
                </div>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {partners.map((p) => (
                  <li key={p.id}>
                    <label
                      className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                        selectedPartnerIds.includes(p.id)
                          ? "border-[var(--brand)] bg-[#184f951a]"
                          : "border-[var(--border)] hover:border-[var(--brand)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPartnerIds.includes(p.id)}
                        onChange={() => togglePartner(p.id)}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-text-primary">{p.name}</div>
                        <div className="text-xs text-text-muted">{CATEGORY_LABEL[p.category]}</div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          <Helper>
            Marca qué stakeholders deben recibir la encuesta de cada partner. Se preseleccionan los
            evaluadores ya asignados a cada partner. Usa la selección rápida para aplicar el mismo grupo a
            todos los partners elegidos, y ajusta caso por caso si lo necesitas.
          </Helper>

          <div className="rounded-lg border border-[var(--border)] p-3 mb-4 bg-surface-2">
            <div className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
              Selección rápida (aplica a todos los partners seleccionados)
            </div>
            <div className="flex flex-col gap-2">
              {Array.from(evaluatorsByRole.entries()).map(([role, list]) => (
                <div key={role} className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-text-muted w-32 shrink-0">{ROLE_LABEL[role]}</span>
                  {list.map((e) => (
                    <label key={e.id} className="flex items-center gap-1 text-xs text-text-secondary">
                      <input
                        type="checkbox"
                        checked={quickSelection.includes(e.id)}
                        onChange={() =>
                          setQuickSelection((prev) =>
                            prev.includes(e.id) ? prev.filter((id) => id !== e.id) : [...prev, e.id]
                          )
                        }
                      />
                      {e.name}
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-secondary text-xs mt-3" onClick={applyQuickSelectionToAll}>
              Aplicar a los {selectedPartnerIds.length} partners seleccionados
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {selectedPartnerIds.map((partnerId) => {
              const partner = partners.find((p) => p.id === partnerId);
              const selected = stakeholdersByPartner[partnerId] ?? [];
              return (
                <details key={partnerId} className="rounded-lg border border-[var(--border)] p-3" open>
                  <summary className="cursor-pointer text-sm font-medium text-text-primary flex items-center justify-between">
                    <span>{partner?.name}</span>
                    <span className="text-xs text-text-muted font-normal">{selected.length} stakeholders</span>
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {evaluators.map((e) => (
                      <label key={e.id} className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <input
                          type="checkbox"
                          checked={selected.includes(e.id)}
                          onChange={() => toggleStakeholder(partnerId, e.id)}
                        />
                        {e.name} <span className="text-text-muted">({ROLE_LABEL[e.stakeholderRole]})</span>
                      </label>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <Helper>
            Revisa el resumen antes de enviar. Al confirmar se abrirá el periodo (si no lo estaba) y se
            activarán las asignaciones seleccionadas: cada stakeholder verá su encuesta pendiente en &quot;Mis
            evaluaciones&quot; de inmediato.
          </Helper>
          <ul className="flex flex-col gap-2 text-sm text-text-secondary mb-5">
            <li>
              <strong className="text-text-primary">Periodo:</strong>{" "}
              {periodMode === "existing"
                ? periods.find((p) => p.id === selectedPeriodId)?.label
                : `${newPeriod.label} (nuevo, ${newPeriod.startDate} – ${newPeriod.endDate})`}
            </li>
            <li>
              <strong className="text-text-primary">Partners:</strong> {selectedPartnerIds.length} —{" "}
              {selectedPartnerIds.map((id) => partners.find((p) => p.id === id)?.name).join(", ")}
            </li>
            <li>
              <strong className="text-text-primary">Asignaciones de evaluador a activar:</strong>{" "}
              {totalStakeholders}
            </li>
          </ul>
          {result && "error" in result && (
            <p className="text-sm text-[var(--status-critical)] mb-3">{result.error}</p>
          )}
          <button type="button" disabled={pending} onClick={handleSubmit} className="btn btn-primary">
            <Send size={15} className="mr-1.5 inline" />
            {pending ? "Enviando…" : "Enviar campaña"}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)]">
        <button
          type="button"
          className="btn btn-secondary text-sm"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          <ChevronLeft size={15} className="mr-1 inline" />
          Atrás
        </button>
        {step < STEPS.length - 1 && (
          <button
            type="button"
            className="btn btn-primary text-sm"
            disabled={(step === 0 && !canProceedStep0) || (step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          >
            Siguiente
            <ChevronRight size={15} className="ml-1 inline" />
          </button>
        )}
      </div>
    </Card>
  );
}
