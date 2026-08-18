import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { updateQuestionAction } from "@/lib/actions/questions";
import { QuestionForm } from "../question-form";

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [question, categories] = await Promise.all([
    prisma.question.findUnique({ where: { id }, include: { audiences: true } }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);
  if (!question) notFound();

  return (
    <>
      <PageHeader title={`Editar pregunta ${question.code}`} />
      <Card>
        <QuestionForm
          action={updateQuestionAction.bind(null, question.id)}
          categories={categories}
          defaults={{
            code: question.code,
            text: question.text,
            categoryId: question.categoryId,
            scope: question.scope,
            order: question.order,
            audiences: question.audiences.map((a) => a.stakeholderRole),
          }}
        />
      </Card>
    </>
  );
}
