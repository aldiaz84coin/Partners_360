"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/lib/actions/partners";

const ROLES = ["PRO", "VEN", "PRE", "DEL", "OPS", "OWN"] as const;

const questionSchema = z.object({
  code: z.string().trim().min(2, "El código es obligatorio."),
  text: z.string().trim().min(5, "El texto de la pregunta es obligatorio."),
  categoryId: z.string().min(1, "Selecciona una categoría."),
  scope: z.enum(["CORE", "SPECIFIC", "STRATEGIC"]),
  order: z.coerce.number().int().min(0).default(0),
});

export async function createQuestionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser(["ADMIN"]);
  const parsed = questionSchema.safeParse({
    code: formData.get("code"),
    text: formData.get("text"),
    categoryId: formData.get("categoryId"),
    scope: formData.get("scope"),
    order: formData.get("order") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const existing = await prisma.question.findUnique({ where: { code: parsed.data.code } });
  if (existing) return { error: "Ya existe una pregunta con ese código." };

  const question = await prisma.question.create({ data: parsed.data });

  const audienceRoles = formData.getAll("audience");
  const roles = audienceRoles.length > 0 ? (audienceRoles as string[]) : ROLES;
  await prisma.questionAudience.createMany({
    data: roles
      .filter((r): r is (typeof ROLES)[number] => (ROLES as readonly string[]).includes(r))
      .map((role) => ({ questionId: question.id, stakeholderRole: role, required: true })),
  });

  revalidatePath("/admin/questions");
  return { success: true };
}

export async function updateQuestionAction(
  questionId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser(["ADMIN"]);
  const parsed = questionSchema.safeParse({
    code: formData.get("code"),
    text: formData.get("text"),
    categoryId: formData.get("categoryId"),
    scope: formData.get("scope"),
    order: formData.get("order") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  await prisma.question.update({ where: { id: questionId }, data: parsed.data });

  const submittedRoles = formData
    .getAll("audience")
    .filter((r): r is (typeof ROLES)[number] => (ROLES as readonly string[]).includes(r as string));

  await prisma.$transaction([
    prisma.questionAudience.deleteMany({ where: { questionId } }),
    prisma.questionAudience.createMany({
      data: submittedRoles.map((role) => ({ questionId, stakeholderRole: role, required: true })),
    }),
  ]);

  revalidatePath("/admin/questions");
  revalidatePath(`/admin/questions/${questionId}`);
  return { success: true };
}

export async function toggleQuestionActiveAction(questionId: string, active: boolean) {
  await requireUser(["ADMIN"]);
  await prisma.question.update({ where: { id: questionId }, data: { active } });
  revalidatePath("/admin/questions");
}
