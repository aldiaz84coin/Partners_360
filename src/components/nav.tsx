import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import type { SystemRole } from "@/generated/prisma/enums";

type NavUser = { name: string; email: string; systemRole: SystemRole };

const ROLE_LABEL: Record<SystemRole, string> = {
  ADMIN: "Administrador",
  VIEWER: "Lectura",
  EVALUATOR: "Evaluador",
};

export function AppNav({ user }: { user: NavUser }) {
  const links = [
    { href: "/dashboard", label: "Dashboard", show: user.systemRole === "ADMIN" || user.systemRole === "VIEWER" },
    { href: "/evaluate", label: "Mis evaluaciones", show: true },
    { href: "/admin", label: "Administración", show: user.systemRole === "ADMIN" },
  ].filter((l) => l.show);

  return (
    <header className="border-b border-[var(--border)] bg-surface sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-text-primary tracking-tight">
            Partner 360°
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right leading-tight">
            <div className="text-sm font-medium text-text-primary">{user.name}</div>
            <div className="text-xs text-text-muted">{ROLE_LABEL[user.systemRole]}</div>
          </div>
          <Link href="/account" className="btn btn-ghost !px-2 text-sm">
            Cuenta
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-secondary text-sm">
              Salir
            </button>
          </form>
        </div>
      </div>
      <nav className="sm:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-text-secondary hover:bg-surface-2 whitespace-nowrap"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
