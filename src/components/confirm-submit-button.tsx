"use client";

import type { ReactNode } from "react";

export function ConfirmSubmitButton({
  confirmText,
  className = "btn btn-danger text-sm",
  children,
}: {
  confirmText: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
