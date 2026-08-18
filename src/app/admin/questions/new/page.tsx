import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { createQuestionAction } from "@/lib/actions/questions";
import { QuestionForm } from "../question-form";

export default async function NewQuestionPage() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <>
      <PageHeader title="Nueva pregunta" />
      <Card>
        <QuestionForm action={createQuestionAction} categories={categories} />
      </Card>
    </>
  );
}
