-- CreateEnum
CREATE TYPE "AgreementType" AS ENUM ('ACUERDO_SIN_CG', 'ACUERDO_CON_CG', 'SIN_ACUERDO');

-- CreateEnum
CREATE TYPE "LegalEntity" AS ENUM ('TELEFONICA_ESPANA', 'TELEFONICA_TECH', 'GEPROM');

-- CreateEnum
CREATE TYPE "YesNoNA" AS ENUM ('SI', 'NO', 'NA');

-- AlterTable
ALTER TABLE "partners" ADD COLUMN     "agreementEndDate" TIMESTAMP(3),
ADD COLUMN     "agreementEntity" "LegalEntity",
ADD COLUMN     "agreementStartDate" TIMESTAMP(3),
ADD COLUMN     "agreementType" "AgreementType" NOT NULL DEFAULT 'SIN_ACUERDO',
ADD COLUMN     "exclusivity" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mouEndDate" TIMESTAMP(3),
ADD COLUMN     "mouStartDate" TIMESTAMP(3),
ADD COLUMN     "mouStatus" "YesNoNA" NOT NULL DEFAULT 'NA',
ADD COLUMN     "ndaEndDate" TIMESTAMP(3),
ADD COLUMN     "ndaStartDate" TIMESTAMP(3),
ADD COLUMN     "ndaStatus" "YesNoNA" NOT NULL DEFAULT 'NA',
ADD COLUMN     "slaEndDate" TIMESTAMP(3),
ADD COLUMN     "slaStartDate" TIMESTAMP(3),
ADD COLUMN     "slaStatus" "YesNoNA" NOT NULL DEFAULT 'NA';
