"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/lib/actions/partners";

const CATEGORY_OPTIONS = [
  { value: "ESTRATEGICO", label: "Estratégico" },
  { value: "ESTANDAR", label: "Estandard" },
  { value: "EN_EVALUACION", label: "En Evaluación" },
];

const TECH_AREA_OPTIONS = [
  { value: "AUTOMATIZACION", label: "Automatización" },
  { value: "DIGITALIZACION", label: "Digitalización" },
];

const AGREEMENT_TYPE_OPTIONS = [
  { value: "SIN_ACUERDO", label: "Sin Acuerdo" },
  { value: "ACUERDO_SIN_CG", label: "Acuerdo sin CG" },
  { value: "ACUERDO_CON_CG", label: "Acuerdo con CG" },
];

const LEGAL_ENTITY_OPTIONS = [
  { value: "", label: "Selecciona…" },
  { value: "TELEFONICA_ESPANA", label: "Telefónica España" },
  { value: "TELEFONICA_TECH", label: "Telefónica Tech" },
  { value: "GEPROM", label: "Geprom" },
];

const YES_NO_NA_OPTIONS = [
  { value: "NA", label: "N/A" },
  { value: "SI", label: "Sí" },
  { value: "NO", label: "No" },
];

type Technology = { id: string; name: string };

export type PartnerFormDefaults = {
  name: string;
  description: string;
  category: string;
  techAreas: string[];
  technologyIds: string[];
  partnershipStartDate: string;
  agreementValidUntil: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  active: boolean;
  agreementType: string;
  agreementEntity: string;
  agreementStartDate: string;
  agreementEndDate: string;
  slaStatus: string;
  slaStartDate: string;
  slaEndDate: string;
  ndaStatus: string;
  ndaStartDate: string;
  ndaEndDate: string;
  mouStatus: string;
  mouStartDate: string;
  mouEndDate: string;
  exclusivity: boolean;
};

const initialState: FormState = {};

export function PartnerForm({
  action,
  technologies,
  defaults,
  submitLabel = "Guardar",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  technologies: Technology[];
  defaults?: PartnerFormDefaults;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const d = defaults;

  const [agreementType, setAgreementType] = useState(d?.agreementType ?? "SIN_ACUERDO");
  const [slaStatus, setSlaStatus] = useState(d?.slaStatus ?? "NA");
  const [ndaStatus, setNdaStatus] = useState(d?.ndaStatus ?? "NA");
  const [mouStatus, setMouStatus] = useState(d?.mouStatus ?? "NA");

  return (
    <form action={formAction} className="flex flex-col gap-8 max-w-2xl">
      {/* Datos generales */}
      <section>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Datos generales</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Nombre</label>
            <input name="name" defaultValue={d?.name} required className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Descripción</label>
            <textarea name="description" defaultValue={d?.description} rows={2} className="input" />
          </div>
        </div>
      </section>

      {/* Clasificación */}
      <section>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Clasificación</h2>
        <div className="flex flex-col gap-4">
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-text-secondary mb-1">Categoría</label>
            <select name="category" defaultValue={d?.category ?? "EN_EVALUACION"} className="input">
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Área tecnológica</label>
            <div className="flex flex-wrap gap-4">
              {TECH_AREA_OPTIONS.map((o) => (
                <label key={o.value} className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    name="techAreas"
                    value={o.value}
                    defaultChecked={d ? d.techAreas.includes(o.value) : false}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Tecnologías</label>
            {technologies.length === 0 ? (
              <p className="text-xs text-text-muted">
                No hay tecnologías en el catálogo todavía. Añádelas desde Administración → Tecnologías.
              </p>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {technologies.map((t) => (
                  <label key={t.id} className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      name="technologyIds"
                      value={t.id}
                      defaultChecked={d ? d.technologyIds.includes(t.id) : false}
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Relación */}
      <section>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Relación</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Inicio del partnership</label>
            <input
              name="partnershipStartDate"
              type="date"
              defaultValue={d?.partnershipStartDate}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Vigencia del acuerdo <span className="text-text-muted font-normal">(vacío = N/A)</span>
            </label>
            <input name="agreementValidUntil" type="date" defaultValue={d?.agreementValidUntil} className="input" />
          </div>
        </div>
        <label className="flex items-center gap-1.5 text-sm text-text-secondary">
          <input type="checkbox" name="active" defaultChecked={d ? d.active : true} />
          Partner activo
        </label>
      </section>

      {/* Legal y Compras */}
      <section>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Legal y Compras</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Acuerdo de relación</label>
            <select
              name="agreementType"
              defaultValue={d?.agreementType ?? "SIN_ACUERDO"}
              onChange={(e) => setAgreementType(e.target.value)}
              className="input max-w-xs"
            >
              {AGREEMENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {agreementType !== "SIN_ACUERDO" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Jurídica</label>
                  <select name="agreementEntity" defaultValue={d?.agreementEntity ?? ""} className="input">
                    {LEGAL_ENTITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Fecha inicio</label>
                  <input
                    name="agreementStartDate"
                    type="date"
                    defaultValue={d?.agreementStartDate}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Fecha fin</label>
                  <input name="agreementEndDate" type="date" defaultValue={d?.agreementEndDate} className="input" />
                </div>
              </div>
            )}
          </div>

          {(
            [
              { key: "sla", label: "SLA", status: slaStatus, setStatus: setSlaStatus },
              { key: "nda", label: "NDA", status: ndaStatus, setStatus: setNdaStatus },
              { key: "mou", label: "MOU", status: mouStatus, setStatus: setMouStatus },
            ] as const
          ).map((doc) => (
            <div key={doc.key}>
              <label className="block text-sm font-medium text-text-secondary mb-1">{doc.label}</label>
              <select
                name={`${doc.key}Status`}
                defaultValue={d?.[`${doc.key}Status`] ?? "NA"}
                onChange={(e) => doc.setStatus(e.target.value)}
                className="input max-w-xs"
              >
                {YES_NO_NA_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {doc.status === "SI" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 max-w-md">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Fecha inicio</label>
                    <input
                      name={`${doc.key}StartDate`}
                      type="date"
                      defaultValue={d?.[`${doc.key}StartDate`]}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Fecha fin</label>
                    <input
                      name={`${doc.key}EndDate`}
                      type="date"
                      defaultValue={d?.[`${doc.key}EndDate`]}
                      className="input"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          <label className="flex items-center gap-1.5 text-sm text-text-secondary">
            <input type="checkbox" name="exclusivity" defaultChecked={d ? d.exclusivity : false} />
            Exclusividad
          </label>
        </div>
      </section>

      {/* Contacto principal */}
      <section>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Contacto principal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Nombre</label>
            <input name="contactName" defaultValue={d?.contactName} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
            <input name="contactEmail" type="email" defaultValue={d?.contactEmail} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Teléfono</label>
            <input name="contactPhone" defaultValue={d?.contactPhone} className="input" />
          </div>
        </div>
      </section>

      {state.error && <p className="text-sm text-[var(--status-critical)]">{state.error}</p>}
      {state.success && <p className="text-sm text-[var(--status-good)]">Guardado.</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-fit">
        {pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
