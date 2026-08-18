"use client";

import { useActionState } from "react";
import { updateUserAction, resetUserPasswordAction } from "@/lib/actions/users";
import type { FormState } from "@/lib/actions/partners";

const initialState: FormState = {};

export function EditUserForm({ userId, name, systemRole }: { userId: string; name: string; systemRole: string }) {
  const action = updateUserAction.bind(null, userId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-sm">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Nombre</label>
        <input name="name" defaultValue={name} required className="input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Nivel de acceso</label>
        <select name="systemRole" defaultValue={systemRole} className="input">
          <option value="EVALUATOR">Evaluador</option>
          <option value="VIEWER">Lectura (dashboard)</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>
      {state.error && <p className="text-sm text-[var(--status-critical)]">{state.error}</p>}
      {state.success && <p className="text-sm text-[var(--status-good)]">Guardado.</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-fit">
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

const resetInitial: FormState = {};

export function ResetPasswordForm({ userId }: { userId: string }) {
  const action = resetUserPasswordAction.bind(null, userId);
  const [state, formAction, pending] = useActionState(action, resetInitial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Nueva contraseña</label>
        <input name="password" type="text" minLength={8} required className="input w-auto" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-secondary">
        {pending ? "Actualizando…" : "Restablecer contraseña"}
      </button>
      {state.error && <p className="text-sm text-[var(--status-critical)]">{state.error}</p>}
      {state.success && <p className="text-sm text-[var(--status-good)]">Contraseña actualizada.</p>}
    </form>
  );
}
