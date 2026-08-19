"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export type CampaignInput = {
  periodMode: "existing" | "new";
  periodId?: string;
  newPeriod?: { label: string; startDate: string; endDate: string };
  partnerIds: string[];
  stakeholdersByPartner: Record<string, string[]>;
};

export type CampaignResult =
  | { error: string }
  | { success: true; periodLabel: string; partnerCount: number; assignmentCount: number };

export async function launchCampaignAction(input: CampaignInput): Promise<CampaignResult> {
  await requireUser(["ADMIN"]);

  if (!input.partnerIds || input.partnerIds.length === 0) {
    return { error: "Selecciona al menos un partner para la campaña." };
  }

  const totalStakeholders = input.partnerIds.reduce(
    (sum, id) => sum + (input.stakeholdersByPartner[id]?.length ?? 0),
    0
  );
  if (totalStakeholders === 0) {
    return { error: "Selecciona al menos un stakeholder que reciba la encuesta." };
  }

  let periodId = input.periodId;

  if (input.periodMode === "new") {
    const np = input.newPeriod;
    if (!np || !np.label?.trim()) return { error: "Indica una etiqueta para el nuevo periodo." };
    const label = np.label.trim();
    const startDate = new Date(np.startDate);
    const endDate = new Date(np.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return { error: "Indica fechas de inicio y fin válidas para el periodo." };
    }
    if (endDate <= startDate) return { error: "La fecha de fin del periodo debe ser posterior al inicio." };

    const existing = await prisma.period.findUnique({ where: { label } });
    if (existing) {
      periodId = existing.id;
    } else {
      const created = await prisma.period.create({ data: { label, startDate, endDate, status: "OPEN" } });
      periodId = created.id;
    }
  }

  if (!periodId) return { error: "Selecciona un periodo para la campaña." };

  const period = await prisma.period.findUnique({ where: { id: periodId } });
  if (!period) return { error: "El periodo seleccionado ya no existe." };

  const partners = await prisma.partner.findMany({
    where: { id: { in: input.partnerIds }, active: true },
    select: { id: true },
  });
  const validPartnerIds = new Set(partners.map((p) => p.id));
  if (validPartnerIds.size === 0) return { error: "Los partners seleccionados no son válidos." };

  const allUserIds = Array.from(new Set(Object.values(input.stakeholdersByPartner).flat()));
  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds }, active: true, isEvaluator: true, stakeholderRole: { not: null } },
    select: { id: true, stakeholderRole: true },
  });
  const roleByUser = new Map(users.map((u) => [u.id, u.stakeholderRole!]));

  if (period.status !== "OPEN") {
    await prisma.period.update({ where: { id: periodId }, data: { status: "OPEN" } });
  }

  let assignmentCount = 0;
  for (const partnerId of input.partnerIds) {
    if (!validPartnerIds.has(partnerId)) continue;
    const userIds = input.stakeholdersByPartner[partnerId] ?? [];
    for (const userId of userIds) {
      const stakeholderRole = roleByUser.get(userId);
      if (!stakeholderRole) continue;
      await prisma.partnerAssignment.upsert({
        where: { partnerId_userId_stakeholderRole: { partnerId, userId, stakeholderRole } },
        update: { active: true },
        create: { partnerId, userId, stakeholderRole },
      });
      assignmentCount++;
    }
  }

  revalidatePath("/admin/periods");
  revalidatePath("/admin/partners");
  revalidatePath("/admin");
  revalidatePath("/evaluate");

  return { success: true, periodLabel: period.label, partnerCount: validPartnerIds.size, assignmentCount };
}
