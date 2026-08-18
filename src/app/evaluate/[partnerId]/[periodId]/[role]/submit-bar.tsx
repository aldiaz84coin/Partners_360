"use client";

import { useFormStatus } from "react-dom";

export function SubmitBar() {
  const { pending } = useFormStatus();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-surface">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-end gap-3">
        <button type="submit" name="intent" value="draft" disabled={pending} className="btn btn-secondary">
          Guardar borrador
        </button>
        <button
          type="submit"
          name="intent"
          value="submit"
          disabled={pending}
          onClick={(e) => {
            if (!confirm("¿Enviar la evaluación? No podrás editarla después.")) e.preventDefault();
          }}
          className="btn btn-primary"
        >
          {pending ? "Enviando…" : "Enviar evaluación"}
        </button>
      </div>
    </div>
  );
}
