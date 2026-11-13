-- AlterTable
ALTER TABLE "public"."NotetakingPipelineRun" ADD COLUMN IF NOT EXISTS "experimentId" TEXT,
ADD COLUMN IF NOT EXISTS "variant" TEXT;
