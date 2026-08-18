"use client";

import { useActionState } from "react";
import { createUserAction } from "@/lib/actions/users";
import type { FormState } from "@/lib/actions/partners";

const initialState: FormState = {};

export function NewUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Nombre</label>
        <input name="name" required className="input w-auto" />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
        <input name="email" type="email" required className="input w-auto" />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Acceso</label>
        <select name="systemRole" defaultValue="EVALUATOR" className="input w-auto">
          <option value="EVALUATOR">Evaluador</option>
          <option value="VIEWER">Lectura (dashboard)</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Contraseña inicial</label>
        <input name="password" type="text" minLength={8} required className="input w-auto" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Creando…" : "Crear usuario"}
      </button>
      {state.error && <p className="text-sm text-[var(--status-critical)] basis-full">{state.error}</p>}
    </form>
  );
}
