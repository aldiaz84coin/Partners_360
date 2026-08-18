"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getOrCreateEvaluation } from "@/lib/evaluations-data";
import type { StakeholderRole } from "@/generated/prisma/enums";

export async function startEvaluationAction(formData: FormData) {
  const user = await requireUser();
  const partnerId = String(formData.get("partnerId"));
  const periodId = String(formData.get("periodId"));
  const stakeholderRole = String(formData.get("stakeholderRole")) as StakeholderRole;

  const assignment = await prisma.partnerAssignment.findUnique({
    where: { partnerId_userId_stakeholderRole: { partnerId, userId: user.id, stakeholderRole } },
  });
  if (!assignment || !assignment.active) redirect("/evaluate");

  await getOrCreateEvaluation(partnerId, periodId, user.id, stakeholderRole);
  redirect(`/evaluate/${partnerId}/${periodId}/${stakeholderRole}`);
}

export async function saveAnswersAction(evaluationId: string, formData: FormData) {
  const user = await requireUser();
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: { period: true },
  });
  if (!evaluation || evaluation.userId !== user.id) redirect("/evaluate");
  if (evaluation.status === "SUBMITTED" || evaluation.period.status === "CLOSED") {
    redirect(`/evaluate/${evaluation.partnerId}/${evaluation.periodId}/${evaluation.stakeholderRole}`);
  }

  const intent = formData.get("intent");
  const submit = intent === "submit";

  const audiences = await prisma.questionAudience.findMany({
    where: { stakeholderRole: evaluation.stakeholderRole, question: { active: true } },
    include: { question: true },
  });

  const answerWrites = [];
  const missingRequired: string[] = [];
  for (const aud of audiences) {
    const raw = formData.get(`q_${aud.questionId}`);
    if (raw === null || raw === "") {
      if (submit && aud.required) missingRequired.push(aud.question.code);
      continue;
    }
    const isNA = raw === "NA";
    const value = isNA ? null : Number(raw);
    answerWrites.push(
      prisma.answer.upsert({
        where: { evaluationId_questionId: { evaluationId, questionId: aud.questionId } },
        update: { value, isNA },
        create: { evaluationId, questionId: aud.questionId, value, isNA },
      })
    );
  }

  const readyToSubmit = submit && missingRequired.length === 0;
  const comment = formData.get("comment");

  await prisma.$transaction([
    ...answerWrites,
    prisma.evaluation.update({
      where: { id: evaluationId },
      data: {
        comment: typeof comment === "string" ? comment.slice(0, 4000) : undefined,
        ...(readyToSubmit ? { status: "SUBMITTED" as const, submittedAt: new Date() } : {}),
      },
    }),
  ]);

  revalidatePath("/evaluate");
  const formPath = `/evaluate/${evaluation.partnerId}/${evaluation.periodId}/${evaluation.stakeholderRole}`;
  revalidatePath(formPath);

  if (submit && missingRequired.length > 0) {
    redirect(`${formPath}?missing=${encodeURIComponent(missingRequired.join(","))}`);
  }
  if (readyToSubmit) {
    redirect(`/evaluate?submitted=1`);
  }
  redirect(`${formPath}?saved=1`);
}
