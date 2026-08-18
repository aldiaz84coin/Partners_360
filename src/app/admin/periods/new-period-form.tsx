"use client";

import { useActionState } from "react";
import { createPeriodAction } from "@/lib/actions/periods";
import type { FormState } from "@/lib/actions/partners";

const initialState: FormState = {};

export function NewPeriodForm() {
  const [state, formAction, pending] = useActionState(createPeriodAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Etiqueta</label>
        <input name="label" placeholder="2026-Q2" required className="input w-32" />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Inicio</label>
        <input name="startDate" type="date" required className="input w-auto" />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Fin</label>
        <input name="endDate" type="date" required className="input w-auto" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Creando…" : "Crear periodo"}
      </button>
      {state.error && <p className="text-sm text-[var(--status-critical)] basis-full">{state.error}</p>}
    </form>
  );
}
