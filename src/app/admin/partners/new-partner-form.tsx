"use client";

import { useActionState } from "react";
import { createPartnerAction, type FormState } from "@/lib/actions/partners";

const initialState: FormState = {};

export function NewPartnerForm() {
  const [state, formAction, pending] = useActionState(createPartnerAction, initialState);

  return (
    <form action={formAction} className="flex flex-col sm:flex-row gap-3 items-start">
      <input name="name" placeholder="Nombre del partner" required className="input sm:max-w-xs" />
      <input name="description" placeholder="Descripción (opcional)" className="input sm:max-w-sm" />
      <button type="submit" disabled={pending} className="btn btn-primary shrink-0">
        {pending ? "Creando…" : "Añadir partner"}
      </button>
      {state.error && <p className="text-sm text-[var(--status-critical)]">{state.error}</p>}
    </form>
  );
}
