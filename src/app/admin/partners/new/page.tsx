import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { createPartnerAction } from "@/lib/actions/partners";
import { PartnerForm } from "../partner-form";

export default async function NewPartnerPage() {
  const technologies = await prisma.technology.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader title="Nuevo partner" />
      <Card>
        <PartnerForm action={createPartnerAction} technologies={technologies} submitLabel="Crear partner" />
      </Card>
    </>
  );
}
