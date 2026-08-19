"use client";

import { useActionState } from "react";
import { createTechnologyAction } from "@/lib/actions/technologies";
import type { FormState } from "@/lib/actions/partners";

const initialState: FormState = {};

export function NewTechnologyForm() {
  const [state, formAction, pending] = useActionState(createTechnologyAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Nombre</label>
        <input name="name" placeholder="p.ej. RPA" required className="input w-auto" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Añadiendo…" : "Añadir tecnología"}
      </button>
      {state.error && <p className="text-sm text-[var(--status-critical)]">{state.error}</p>}
    </form>
  );
}
