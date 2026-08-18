"use client";

import { useActionState } from "react";
import { addAssignmentAction, type FormState } from "@/lib/actions/partners";

const ROLES = [
  { value: "PRO", label: "Producto" },
  { value: "VEN", label: "Ventas" },
  { value: "PRE", label: "Ingeniería Preventa" },
  { value: "DEL", label: "Delivery" },
  { value: "OPS", label: "Operaciones / Soporte" },
  { value: "OWN", label: "Partner Owner" },
];

const initialState: FormState = {};

export function AddAssignmentForm({
  partnerId,
  users,
}: {
  partnerId: string;
  users: { id: string; name: string; email: string }[];
}) {
  const action = addAssignmentAction.bind(null, partnerId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Stakeholder</label>
        <select name="userId" required className="input w-auto">
          <option value="">Selecciona un usuario…</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Rol</label>
        <select name="stakeholderRole" required className="input w-auto">
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Añadiendo…" : "Asignar"}
      </button>
      {state.error && <p className="text-sm text-[var(--status-critical)]">{state.error}</p>}
    </form>
  );
}
