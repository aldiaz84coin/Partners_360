"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export type FormState = { error?: string; success?: boolean };

const optionalString = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.string().trim().optional()
);
const optionalDate = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.date().optional());
const optionalEmail = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.string().trim().email("Email de contacto inválido.").optional()
);

const partnerSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  description: optionalString,
  category: z.enum(["ESTRATEGICO", "ESTANDAR", "NUEVO"]),
  techAreas: z.array(z.enum(["AUTOMATIZACION", "DIGITALIZACION"])),
  technologyIds: z.array(z.string()),
  partnershipStartDate: optionalDate,
  agreementValidUntil: optionalDate,
  contactName: optionalString,
  contactEmail: optionalEmail,
  contactPhone: optionalString,
  active: z.boolean(),
});

function readPartnerForm(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    category: formData.get("category"),
    techAreas: formData.getAll("techAreas"),
    technologyIds: formData.getAll("technologyIds"),
    partnershipStartDate: formData.get("partnershipStartDate") || undefined,
    agreementValidUntil: formData.get("agreementValidUntil") || undefined,
    contactName: formData.get("contactName") || undefined,
    contactEmail: formData.get("contactEmail") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    active: formData.get("active") === "on",
  };
}

export async function createPartnerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser(["ADMIN"]);
  const parsed = partnerSchema.safeParse(readPartnerForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const { technologyIds, ...data } = parsed.data;
  const partner = await prisma.partner.create({
    data: { ...data, technologies: { connect: technologyIds.map((id) => ({ id })) } },
  });
  revalidatePath("/admin/partners");
  redirect(`/admin/partners/${partner.id}`);
}

export async function updatePartnerAction(
  partnerId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser(["ADMIN"]);
  const parsed = partnerSchema.safeParse(readPartnerForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const { technologyIds, ...data } = parsed.data;
  await prisma.partner.update({
    where: { id: partnerId },
    data: { ...data, technologies: { set: technologyIds.map((id) => ({ id })) } },
  });
  revalidatePath("/admin/partners");
  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: true };
}

export async function togglePartnerActiveAction(partnerId: string, active: boolean) {
  await requireUser(["ADMIN"]);
  await prisma.partner.update({ where: { id: partnerId }, data: { active } });
  revalidatePath("/admin/partners");
}

export async function deletePartnerAction(partnerId: string) {
  await requireUser(["ADMIN"]);
  await prisma.partner.delete({ where: { id: partnerId } });
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
