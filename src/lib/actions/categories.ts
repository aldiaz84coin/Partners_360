"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/lib/actions/partners";

const schema = z.object({
  name: z.string().trim().min(2),
  weight: z.coerce.number().int().min(0).max(100),
});

export async function updateCategoryAction(
  categoryId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser(["ADMIN"]);
  const parsed = schema.safeParse({ name: formData.get("name"), weight: formData.get("weight") });
  if (!parsed.success) return { error: "Datos inválidos." };

  await prisma.category.update({ where: { id: categoryId }, data: parsed.data });
  revalidatePath("/admin/categories");
  return { success: true };
}
