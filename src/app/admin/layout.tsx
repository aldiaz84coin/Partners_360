import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AppNav } from "@/components/nav";

const SECTIONS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/technologies", label: "Tecnologías" },
  { href: "/admin/users", label: "Stakeholders" },
  { href: "/admin/questions", label: "Preguntas" },
  { href: "/admin/categories", label: "Categorías" },
  { href: "/admin/periods", label: "Periodos" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["ADMIN"]);
  return (
    <div className="flex flex-col flex-1">
      <AppNav user={user} />
      <div className="border-b border-[var(--border)] bg-surface">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary whitespace-nowrap border-b-2 border-transparent hover:border-[var(--brand)] transition-colors"
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">{children}</main>
    </div>
  );
}
