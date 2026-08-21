import { prisma } from "@/lib/prisma";
import type { StakeholderRole } from "@/generated/prisma/enums";

export type CampaignRowStatus = "PENDING" | "DRAFT" | "SUBMITTED";

export type CampaignRow = {
  partnerId: string;
  partnerName: string;
  userId: string;
  userName: string;
  userEmail: string;
  stakeholderRole: StakeholderRole;
  status: CampaignRowStatus;
  submittedAt: Date | null;
  updatedAt: Date | null;
};

export type CampaignSummary = {
  total: number;
  submitted: number;
  draft: number;
  pending: number;
  responseRate: number | null;
};

/**
 * Execution status for a period: every active partner×stakeholder assignment,
 * crossed with whatever evaluation (if any) exists for that period — mirroring
 * how getMyPendingWork derives an evaluator's own pending list, but for all of them.
 */
export async function getCampaignExecution(periodId: string): Promise<CampaignRow[]> {
  const [assignments, evaluations] = await Promise.all([
    prisma.partnerAssignment.findMany({
      where: { active: true, partner: { active: true }, user: { active: true } },
      include: { partner: { select: { id: true, name: true } }, user: { select: { id: true, name: true, email: true } } },
      orderBy: [{ partner: { name: "asc" } }, { stakeholderRole: "asc" }],
    }),
    prisma.evaluation.findMany({
      where: { periodId },
      select: { partnerId: true, userId: true, stakeholderRole: true, status: true, submittedAt: true, updatedAt: true },
    }),
  ]);

  const evalKey = (partnerId: string, userId: string, role: string) => `${partnerId}:${userId}:${role}`;
  const evalMap = new Map(evaluations.map((e) => [evalKey(e.partnerId, e.userId, e.stakeholderRole), e]));

  return assignments.map((a) => {
    const existing = evalMap.get(evalKey(a.partnerId, a.userId, a.stakeholderRole));
    return {
      partnerId: a.partnerId,
      partnerName: a.partner.name,
      userId: a.userId,
      userName: a.user.name,
      userEmail: a.user.email,
      stakeholderRole: a.stakeholderRole,
      status: existing?.status ?? "PENDING",
      submittedAt: existing?.submittedAt ?? null,
      updatedAt: existing?.updatedAt ?? null,
    };
  });
}

export function summarizeCampaign(rows: CampaignRow[]): CampaignSummary {
  const total = rows.length;
  const submitted = rows.filter((r) => r.status === "SUBMITTED").length;
  const draft = rows.filter((r) => r.status === "DRAFT").length;
  const pending = rows.filter((r) => r.status === "PENDING").length;
  return {
    total,
    submitted,
    draft,
    pending,
    responseRate: total === 0 ? null : Math.round((submitted / total) * 100),
  };
}
