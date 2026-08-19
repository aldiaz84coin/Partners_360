-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isEvaluator" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "stakeholderRole" "StakeholderRole";
