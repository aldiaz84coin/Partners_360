"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const partnerSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  description: z.string().trim().optional(),
});

export type FormState = { error?: string; success?: boolean };

export async function createPartnerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser(["ADMIN"]);
  const parsed = partnerSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  await prisma.partner.create({ data: parsed.data });
  revalidatePath("/admin/partners");
  return { success: true };
}

export async function updatePartnerAction(
  partnerId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser(["ADMIN"]);
  const parsed = partnerSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  await prisma.partner.update({ where: { id: partnerId }, data: parsed.data });
  revalidatePath("/admin/partners");
  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: true };
}

export async function togglePartnerActiveAction(partnerId: string, active: boolean) {
  await requireUser(["ADMIN"]);
  await prisma.partner.update({ where: { id: partnerId }, data: { active } });
  revalidatePath("/admin/partners");
}

const assignmentSchema = z.object({
  userId: z.string().min(1),
  stakeholderRole: z.enum(["PRO", "VEN", "PRE", "DEL", "OPS", "OWN"]),
});

export async function addAssignmentAction(
  partnerId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser(["ADMIN"]);
  const parsed = assignmentSchema.safeParse({
    userId: formData.get("userId"),
    stakeholderRole: formData.get("stakeholderRole"),
  });
  if (!parsed.success) return { error: "Selecciona un usuario y un rol válidos." };

  await prisma.partnerAssignment.upsert({
    where: {
      partnerId_userId_stakeholderRole: {
        partnerId,
        userId: parsed.data.userId,
        stakeholderRole: parsed.data.stakeholderRole,
      },
    },
    update: { active: true },
    create: { partnerId, userId: parsed.data.userId, stakeholderRole: parsed.data.stakeholderRole },
  });
  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: true };
}

export async function toggleAssignmentAction(assignmentId: string, partnerId: string, active: boolean) {
  await requireUser(["ADMIN"]);
  await prisma.partnerAssignment.update({ where: { id: assignmentId }, data: { active } });
  revalidatePath(`/admin/partners/${partnerId}`);
}
