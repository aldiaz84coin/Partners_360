import { prisma } from "@/lib/prisma";
import type { StakeholderRole } from "@/generated/prisma/enums";

const SCOPE_ORDER: Record<string, number> = { CORE: 0, STRATEGIC: 1, SPECIFIC: 2 };

export async function getQuestionsForRole(role: StakeholderRole) {
  const audiences = await prisma.questionAudience.findMany({
    where: { stakeholderRole: role, question: { active: true } },
    include: { question: { include: { category: true } } },
  });
  return audiences
    .map((a) => ({
      questionId: a.questionId,
      code: a.question.code,
      text: a.question.text,
      scope: a.question.scope,
      order: a.question.order,
      required: a.required,
      category: { code: a.question.category.code, name: a.question.category.name },
    }))
    .sort((a, b) => SCOPE_ORDER[a.scope] - SCOPE_ORDER[b.scope] || a.order - b.order);
}

export async function getOrCreateEvaluation(
  partnerId: string,
  periodId: string,
  userId: string,
  stakeholderRole: StakeholderRole
) {
  return prisma.evaluation.upsert({
    where: { partnerId_periodId_userId_stakeholderRole: { partnerId, periodId, userId, stakeholderRole } },
    update: {},
    create: { partnerId, periodId, userId, stakeholderRole },
  });
}

export async function getMyPendingWork(userId: string) {
  const assignments = await prisma.partnerAssignment.findMany({
    where: { userId, active: true },
    include: { partner: true },
  });
  const periods = await prisma.period.findMany({
    where: { status: "OPEN" },
    orderBy: { startDate: "desc" },
  });
  const evaluations = await prisma.evaluation.findMany({
    where: { userId },
    select: { id: true, partnerId: true, periodId: true, stakeholderRole: true, status: true },
  });
  const evalKey = (partnerId: string, periodId: string, role: string) => `${partnerId}:${periodId}:${role}`;
  const evalMap = new Map(evaluations.map((e) => [evalKey(e.partnerId, e.periodId, e.stakeholderRole), e]));

  const rows = assignments.flatMap((a) =>
    periods.map((p) => {
      const existing = evalMap.get(evalKey(a.partnerId, p.id, a.stakeholderRole));
      return {
        partnerId: a.partnerId,
        partnerName: a.partner.name,
        periodId: p.id,
        periodLabel: p.label,
        stakeholderRole: a.stakeholderRole,
        status: existing?.status ?? ("PENDING" as const),
      };
    })
  );
  return rows;
}

export async function getMyHistory(userId: string) {
  return prisma.evaluation.findMany({
    where: { userId, status: "SUBMITTED" },
    include: { partner: true, period: true },
    orderBy: { submittedAt: "desc" },
  });
}
