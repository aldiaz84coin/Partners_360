import { prisma } from "@/lib/prisma";
import {
  average,
  normalizeValue,
  overallScore,
  scoresByCategory,
  type CategoryScore,
} from "@/lib/scoring";
import { getExpiringLegalDocs } from "@/lib/partner-legal";
import type { StakeholderRole, TechArea } from "@/generated/prisma/enums";

export async function getCategoryWeights() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  return categories.map((c) => ({ code: c.code, name: c.name, weight: c.weight }));
}

async function submittedAnswers(where: { partnerId?: string; periodId?: string }) {
  const evaluations = await prisma.evaluation.findMany({
    where: { status: "SUBMITTED", ...where },
    include: {
      answers: { include: { question: { include: { category: true } } } },
    },
  });
  return evaluations;
}

export type PartnerPeriodResult = {
  overall: number | null;
  categories: CategoryScore[];
  responded: number;
  expected: number;
};

export async function getPartnerPeriodScore(partnerId: string, periodId: string): Promise<PartnerPeriodResult> {
  const [categories, evaluations, expected] = await Promise.all([
    getCategoryWeights(),
    submittedAnswers({ partnerId, periodId }),
    prisma.partnerAssignment.count({ where: { partnerId, active: true } }),
  ]);

  const flatAnswers = evaluations.flatMap((ev) =>
    ev.answers.map((a) => ({
      categoryCode: a.question.category.code,
      value: normalizeValue(a.value, a.isNA),
    }))
  );

  const categoryScores = scoresByCategory(categories, flatAnswers);
  return {
    overall: overallScore(categoryScores),
    categories: categoryScores,
    responded: evaluations.length,
    expected,
  };
}

export type StakeholderGapEntry = { role: StakeholderRole; score: number | null; count: number };

export async function getStakeholderGap(partnerId: string, periodId: string): Promise<StakeholderGapEntry[]> {
  const categories = await getCategoryWeights();
  const evaluations = await submittedAnswers({ partnerId, periodId });

  const byRole = new Map<StakeholderRole, typeof evaluations>();
  for (const ev of evaluations) {
    const list = byRole.get(ev.stakeholderRole) ?? [];
    list.push(ev);
    byRole.set(ev.stakeholderRole, list);
  }

  const roles: StakeholderRole[] = ["PRO", "VEN", "PRE", "DEL", "OPS", "OWN"];
  return roles.map((role) => {
    const evals = byRole.get(role) ?? [];
    const flatAnswers = evals.flatMap((ev) =>
      ev.answers.map((a) => ({
        categoryCode: a.question.category.code,
        value: normalizeValue(a.value, a.isNA),
      }))
    );
    const categoryScores = scoresByCategory(categories, flatAnswers);
    return { role, score: overallScore(categoryScores), count: evals.length };
  });
}

export type TrendPoint = { periodId: string; label: string; score: number | null };

export async function getPartnerTrend(partnerId: string): Promise<TrendPoint[]> {
  const [categories, periods] = await Promise.all([
    getCategoryWeights(),
    prisma.period.findMany({ orderBy: { startDate: "asc" } }),
  ]);

  const evaluations = await submittedAnswers({ partnerId });
  const byPeriod = new Map<string, typeof evaluations>();
  for (const ev of evaluations) {
    const list = byPeriod.get(ev.periodId) ?? [];
    list.push(ev);
    byPeriod.set(ev.periodId, list);
  }

  return periods.map((p) => {
    const evals = byPeriod.get(p.id) ?? [];
    const flatAnswers = evals.flatMap((ev) =>
      ev.answers.map((a) => ({
        categoryCode: a.question.category.code,
        value: normalizeValue(a.value, a.isNA),
      }))
    );
    const categoryScores = scoresByCategory(categories, flatAnswers);
    return { periodId: p.id, label: p.label, score: overallScore(categoryScores) };
  });
}

export type PartnerSummary = {
  partnerId: string;
  name: string;
  overall: number | null;
  responded: number;
  expected: number;
  expiringDocsCount: number;
};

export async function getAllPartnersSummary(periodId: string, techArea?: TechArea): Promise<PartnerSummary[]> {
  const partners = await prisma.partner.findMany({
    where: { active: true, ...(techArea ? { techAreas: { has: techArea } } : {}) },
    orderBy: { name: "asc" },
  });
  const categories = await getCategoryWeights();

  const results: PartnerSummary[] = [];
  for (const partner of partners) {
    const [evaluations, expected] = await Promise.all([
      submittedAnswers({ partnerId: partner.id, periodId }),
      prisma.partnerAssignment.count({ where: { partnerId: partner.id, active: true } }),
    ]);
    const flatAnswers = evaluations.flatMap((ev) =>
      ev.answers.map((a) => ({
        categoryCode: a.question.category.code,
        value: normalizeValue(a.value, a.isNA),
      }))
    );
    const categoryScores = scoresByCategory(categories, flatAnswers);
    results.push({
      partnerId: partner.id,
      name: partner.name,
      overall: overallScore(categoryScores),
      responded: evaluations.length,
      expected,
      expiringDocsCount: getExpiringLegalDocs(partner).length,
    });
  }
  return results;
}

export function averageOf(values: (number | null)[]): number | null {
  return average(values.filter((v): v is number => v !== null));
}
