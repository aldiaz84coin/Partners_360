"use client";

import { useActionState } from "react";
import { updatePartnerAction, type FormState } from "@/lib/actions/partners";

const initialState: FormState = {};

export function EditPartnerForm({
  partnerId,
  name,
  description,
}: {
  partnerId: string;
  name: string;
  description: string;
}) {
  const action = updatePartnerAction.bind(null, partnerId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-md">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Nombre</label>
        <input name="name" defaultValue={name} required className="input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Descripción</label>
        <input name="description" defaultValue={description} className="input" />
      </div>
      {state.error && <p className="text-sm text-[var(--status-critical)]">{state.error}</p>}
      {state.success && <p className="text-sm text-[var(--status-good)]">Guardado.</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-fit">
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
