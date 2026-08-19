"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/actions/partners";

const CATEGORY_OPTIONS = [
  { value: "ESTRATEGICO", label: "Estratégico" },
  { value: "ESTANDAR", label: "Estándar" },
  { value: "NUEVO", label: "Nuevo" },
];

const TECH_AREA_OPTIONS = [
  { value: "AUTOMATIZACION", label: "Automatización" },
  { value: "DIGITALIZACION", label: "Digitalización" },
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
            <select name="category" defaultValue={d?.category ?? "NUEVO"} className="input">
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
