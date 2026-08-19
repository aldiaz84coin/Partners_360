-- CreateEnum
CREATE TYPE "TechArea" AS ENUM ('AUTOMATIZACION', 'DIGITALIZACION');

-- CreateEnum
CREATE TYPE "PartnerCategory" AS ENUM ('ESTRATEGICO', 'ESTANDAR', 'NUEVO');

-- AlterTable
ALTER TABLE "partners" ADD COLUMN     "agreementValidUntil" TIMESTAMP(3),
ADD COLUMN     "category" "PartnerCategory" NOT NULL DEFAULT 'NUEVO',
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "partnershipStartDate" TIMESTAMP(3),
ADD COLUMN     "techAreas" "TechArea"[];

-- CreateTable
CREATE TABLE "technologies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "technologies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PartnerToTechnology" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PartnerToTechnology_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "technologies_name_key" ON "technologies"("name");

-- CreateIndex
CREATE INDEX "_PartnerToTechnology_B_index" ON "_PartnerToTechnology"("B");

-- AddForeignKey
ALTER TABLE "_PartnerToTechnology" ADD CONSTRAINT "_PartnerToTechnology_A_fkey" FOREIGN KEY ("A") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartnerToTechnology" ADD CONSTRAINT "_PartnerToTechnology_B_fkey" FOREIGN KEY ("B") REFERENCES "technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
