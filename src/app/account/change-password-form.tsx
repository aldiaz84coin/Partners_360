"use client";

import { useActionState } from "react";
import { changePasswordAction, type ChangePasswordState } from "@/lib/actions/auth";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Contraseña actual</label>
        <input name="currentPassword" type="password" required className="input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Nueva contraseña</label>
        <input name="newPassword" type="password" required minLength={8} className="input" />
      </div>
      {state.error && <p className="text-sm text-[var(--status-critical)]">{state.error}</p>}
      {state.success && <p className="text-sm text-[var(--status-good)]">Contraseña actualizada.</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-fit disabled:opacity-60">
        {pending ? "Guardando…" : "Actualizar contraseña"}
      </button>
    </form>
  );
}
