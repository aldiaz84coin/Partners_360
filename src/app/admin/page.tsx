import Link from "next/link";
import { Rocket } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";

export default async function AdminOverviewPage() {
  const [partners, users, questions, periods, openPeriod] = await Promise.all([
    prisma.partner.count({ where: { active: true } }),
    prisma.user.count({ where: { active: true } }),
    prisma.question.count({ where: { active: true } }),
    prisma.period.count(),
    prisma.period.findFirst({ where: { status: "OPEN" }, orderBy: { startDate: "desc" } }),
  ]);

  const stats = [
    { label: "Partners activos", value: partners, href: "/admin/partners" },
    { label: "Stakeholders activos", value: users, href: "/admin/users" },
    { label: "Preguntas activas", value: questions, href: "/admin/questions" },
    { label: "Periodos creados", value: periods, href: "/admin/periods" },
  ];

  return (
    <>
      <PageHeader
        title="Administración"
        subtitle={
          openPeriod
            ? `Periodo abierto: ${openPeriod.label}`
            : "No hay ningún periodo de evaluación abierto actualmente."
        }
        actions={
          <Link href="/admin/campaigns/new" className="btn btn-primary text-sm">
            <Rocket size={15} className="mr-1.5 inline" />
            Nueva Campaña de Evaluación
          </Link>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="hover:border-[var(--brand)] transition-colors">
              <div className="text-xs font-medium text-text-muted uppercase tracking-wide">{s.label}</div>
              <div className="mt-2 text-3xl font-semibold text-text-primary">{s.value}</div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
