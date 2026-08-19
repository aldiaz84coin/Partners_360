import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { CampaignWizard } from "./campaign-wizard";

export default async function NewCampaignPage() {
  const [periods, partners, evaluators] = await Promise.all([
    prisma.period.findMany({ orderBy: { startDate: "desc" } }),
    prisma.partner.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { assignments: { where: { active: true }, select: { userId: true } } },
    }),
    prisma.user.findMany({
      where: { active: true, isEvaluator: true, stakeholderRole: { not: null } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, stakeholderRole: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Nueva campaña de evaluación"
        subtitle="Asistente guiado para abrir un periodo y notificar a los stakeholders que deben evaluar."
      />
      <CampaignWizard
        periods={periods.map((p) => ({
          id: p.id,
          label: p.label,
          status: p.status,
          startDate: p.startDate.toISOString().slice(0, 10),
          endDate: p.endDate.toISOString().slice(0, 10),
        }))}
        partners={partners.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          assignedUserIds: p.assignments.map((a) => a.userId),
        }))}
        evaluators={evaluators.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          stakeholderRole: u.stakeholderRole as string,
        }))}
      />
    </>
  );
}
