"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, hashPassword } from "@/lib/auth";
import type { FormState } from "@/lib/actions/partners";

const optionalString = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.string().trim().optional()
);
const optionalStakeholderRole = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.enum(["PRO", "VEN", "PRE", "DEL", "OPS", "OWN"]).optional()
);

const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido."),
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  phone: optionalString,
  systemRole: z.enum(["ADMIN", "VIEWER", "EVALUATOR"]),
  stakeholderRole: optionalStakeholderRole,
  isEvaluator: z.boolean(),
  password: z.string().min(8, "La contraseña inicial debe tener al menos 8 caracteres."),
});

export async function createUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser(["ADMIN"]);
  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    systemRole: formData.get("systemRole"),
    stakeholderRole: formData.get("stakeholderRole") || undefined,
    isEvaluator: formData.get("isEvaluator") === "on",
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "Ya existe un usuario con ese email." };

  const { password, ...rest } = parsed.data;
  const passwordHash = await hashPassword(password);
  await prisma.user.create({ data: { ...rest, passwordHash } });
  revalidatePath("/admin/users");
  return { success: true };
}

const updateUserSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  phone: optionalString,
  systemRole: z.enum(["ADMIN", "VIEWER", "EVALUATOR"]),
  stakeholderRole: optionalStakeholderRole,
  isEvaluator: z.boolean(),
});

export async function updateUserAction(userId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser(["ADMIN"]);
  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    systemRole: formData.get("systemRole"),
    stakeholderRole: formData.get("stakeholderRole") || undefined,
    isEvaluator: formData.get("isEvaluator") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  await prisma.user.update({
    where: { id: userId },
    data: { ...parsed.data, stakeholderRole: parsed.data.stakeholderRole ?? null },
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserActiveAction(userId: string, active: boolean) {
  await requireUser(["ADMIN"]);
  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/admin/users");
}

const resetPasswordSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export async function resetUserPasswordAction(
  userId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser(["ADMIN"]);
  const parsed = resetPasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { success: true };
}
