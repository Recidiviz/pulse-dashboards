-- AlterTable
ALTER TABLE "public"."Meeting" ADD COLUMN     "audioDeletedAt" TIMESTAMP(3),
ADD COLUMN     "transcriptDeletedAt" TIMESTAMP(3);
