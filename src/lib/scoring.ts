// Pure scoring helpers — no DB access here so they stay easy to reason about
// and reuse between the dashboard pages and (later) exports/tests.

export const SCALE_TO_100: Record<number, number> = { 1: 0, 2: 25, 3: 50, 4: 75, 5: 100 };

export function normalizeValue(value: number | null, isNA: boolean): number | null {
  if (isNA || value === null) return null;
  return SCALE_TO_100[value] ?? null;
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export type CategoryWeight = { code: string; name: string; weight: number };

export type ScoredAnswer = {
  categoryCode: string;
  value: number | null; // 0-100, already normalized
};

export type CategoryScore = { code: string; name: string; weight: number; score: number | null; count: number };

/** Average normalized score per category from a flat list of answers. */
export function scoresByCategory(
  categories: CategoryWeight[],
  answers: ScoredAnswer[]
): CategoryScore[] {
  return categories.map((cat) => {
    const values = answers
      .filter((a) => a.categoryCode === cat.code && a.value !== null)
      .map((a) => a.value as number);
    return { code: cat.code, name: cat.name, weight: cat.weight, score: average(values), count: values.length };
  });
}

/**
 * Weighted overall score. Categories with no data are excluded and the
 * remaining weights are renormalized so the result still sits on 0-100.
 */
export function overallScore(categoryScores: CategoryScore[]): number | null {
  const available = categoryScores.filter((c) => c.score !== null);
  const totalWeight = available.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return null;
  const weighted = available.reduce((sum, c) => sum + (c.score as number) * c.weight, 0);
  return weighted / totalWeight;
}

export function round1(n: number | null): number | null {
  return n === null ? null : Math.round(n * 10) / 10;
}

export function scoreLabel(score: number | null): string {
  if (score === null) return "Sin datos";
  if (score >= 85) return "Excelente";
  if (score >= 65) return "Bueno";
  if (score >= 45) return "Adecuado";
  if (score >= 25) return "Deficiente";
  return "Muy deficiente";
}
