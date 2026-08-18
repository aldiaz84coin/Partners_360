"use client";

import { useActionState } from "react";
import { updateCategoryAction } from "@/lib/actions/categories";
import type { FormState } from "@/lib/actions/partners";

const initialState: FormState = {};

export function CategoryWeightForm({ categoryId, name, weight }: { categoryId: string; name: string; weight: number }) {
  const action = updateCategoryAction.bind(null, categoryId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Nombre</label>
        <input name="name" defaultValue={name} className="input w-56" />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Peso (%)</label>
        <input name="weight" type="number" min={0} max={100} defaultValue={weight} className="input w-24" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-secondary">
        {pending ? "…" : "Guardar"}
      </button>
      {state.error && <span className="text-sm text-[var(--status-critical)]">{state.error}</span>}
    </form>
  );
}
