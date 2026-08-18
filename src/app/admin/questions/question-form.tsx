"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/actions/partners";

const ROLES = [
  { value: "PRO", label: "Producto" },
  { value: "VEN", label: "Ventas" },
  { value: "PRE", label: "Ing. Preventa" },
  { value: "DEL", label: "Delivery" },
  { value: "OPS", label: "Operaciones" },
  { value: "OWN", label: "Partner Owner" },
];

type Category = { id: string; code: string; name: string };

const initialState: FormState = {};

export function QuestionForm({
  action,
  categories,
  defaults,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  categories: Category[];
  defaults?: {
    code: string;
    text: string;
    categoryId: string;
    scope: string;
    order: number;
    audiences: string[];
  };
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Código</label>
          <input name="code" defaultValue={defaults?.code} required className="input" placeholder="p.ej. REL-1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Orden</label>
          <input name="order" type="number" defaultValue={defaults?.order ?? 0} className="input" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Texto de la pregunta</label>
        <textarea name="text" defaultValue={defaults?.text} required rows={3} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Categoría</label>
          <select name="categoryId" defaultValue={defaults?.categoryId} required className="input">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Alcance</label>
          <select name="scope" defaultValue={defaults?.scope ?? "CORE"} className="input">
            <option value="CORE">Core (todos)</option>
            <option value="STRATEGIC">Estratégica (todos)</option>
            <option value="SPECIFIC">Específica de un rol</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Roles que responden esta pregunta
        </label>
        <div className="flex flex-wrap gap-3">
          {ROLES.map((r) => (
            <label key={r.value} className="flex items-center gap-1.5 text-sm text-text-secondary">
              <input
                type="checkbox"
                name="audience"
                value={r.value}
                defaultChecked={defaults ? defaults.audiences.includes(r.value) : true}
              />
              {r.label}
            </label>
          ))}
        </div>
      </div>
      {state.error && <p className="text-sm text-[var(--status-critical)]">{state.error}</p>}
      {state.success && <p className="text-sm text-[var(--status-good)]">Guardado.</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-fit">
        {pending ? "Guardando…" : "Guardar pregunta"}
      </button>
    </form>
  );
}
