"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/lib/actions/partners";

const schema = z.object({
  label: z.string().trim().min(3, "Indica una etiqueta, p.ej. 2026-Q2."),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export async function createPeriodAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser(["ADMIN"]);
  const parsed = schema.safeParse({
    label: formData.get("label"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  if (parsed.data.endDate <= parsed.data.startDate) return { error: "La fecha de fin debe ser posterior al inicio." };

  const existing = await prisma.period.findUnique({ where: { label: parsed.data.label } });
  if (existing) return { error: "Ya existe un periodo con esa etiqueta." };

  await prisma.period.create({ data: parsed.data });
  revalidatePath("/admin/periods");
  return { success: true };
}

export async function setPeriodStatusAction(periodId: string, status: "OPEN" | "CLOSED") {
  await requireUser(["ADMIN"]);
  await prisma.period.update({ where: { id: periodId }, data: { status } });
  revalidatePath("/admin/periods");
}
