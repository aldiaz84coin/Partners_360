-- Rename the "Nuevo" partner category to "En Evaluación" (existing rows keep their value).
ALTER TYPE "PartnerCategory" RENAME VALUE 'NUEVO' TO 'EN_EVALUACION';

-- AlterTable
ALTER TABLE "partners" ALTER COLUMN "category" SET DEFAULT 'EN_EVALUACION';
