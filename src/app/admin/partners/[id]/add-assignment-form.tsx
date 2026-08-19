"use client";

import { useActionState, useRef } from "react";
import { addAssignmentAction, type FormState } from "@/lib/actions/partners";

const ROLES = [
  { value: "PRO", label: "Producto" },
  { value: "VEN", label: "Ventas" },
  { value: "PRE", label: "Ingeniería Preventa" },
  { value: "DEL", label: "Delivery" },
  { value: "OPS", label: "Operaciones / Soporte" },
  { value: "OWN", label: "Partner Owner" },
];

const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

type EvaluatorUser = { id: string; name: string; email: string; stakeholderRole: string | null };

const initialState: FormState = {};

export function AddAssignmentForm({ partnerId, users }: { partnerId: string; users: EvaluatorUser[] }) {
  const action = addAssignmentAction.bind(null, partnerId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const roleSelectRef = useRef<HTMLSelectElement>(null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Stakeholder</label>
        <select
          name="userId"
          required
          className="input w-auto"
          onChange={(e) => {
            const role = e.target.selectedOptions[0]?.dataset.role;
            if (role && roleSelectRef.current) roleSelectRef.current.value = role;
          }}
        >
          <option value="">Selecciona un usuario…</option>
          {users.map((u) => (
            <option key={u.id} value={u.id} data-role={u.stakeholderRole ?? ""}>
              {u.name} ({u.email})
              {u.stakeholderRole ? ` · ${ROLE_LABEL[u.stakeholderRole]}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Rol</label>
        <select name="stakeholderRole" required ref={roleSelectRef} className="input w-auto">
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
