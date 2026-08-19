-- AlterTable
ALTER TABLE "public"."UsNcRNA" ADD COLUMN     "admitDate" TIMESTAMP(3),
ADD COLUMN     "seqNumber" TEXT;

-- AlterEnum
ALTER TYPE "public"."ResidentFlagId" ADD VALUE 'usNcRNAAutoEnablement';
