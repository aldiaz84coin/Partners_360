"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/lib/actions/partners";

const schema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio."),
});

export async function createTechnologyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser(["ADMIN"]);
  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const existing = await prisma.technology.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { error: "Ya existe esa tecnología en el catálogo." };

  const count = await prisma.technology.count();
  await prisma.technology.create({ data: { name: parsed.data.name, order: count } });
  revalidatePath("/admin/technologies");
  revalidatePath("/admin/partners");
  return { success: true };
}

export async function toggleTechnologyActiveAction(technologyId: string, active: boolean) {
  await requireUser(["ADMIN"]);
  await prisma.technology.update({ where: { id: technologyId }, data: { active } });
  revalidatePath("/admin/technologies");
  revalidatePath("/admin/partners");
}

export async function deleteTechnologyAction(technologyId: string) {
  await requireUser(["ADMIN"]);
  await prisma.technology.delete({ where: { id: technologyId } });
  revalidatePath("/admin/technologies");
  revalidatePath("/admin/partners");
}
