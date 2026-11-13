-- AlterTable
ALTER TABLE "public"."NotetakingPipelineRun" ADD COLUMN IF NOT EXISTS "pipelineVersion" TEXT,
ADD COLUMN IF NOT EXISTS "release" TEXT;

-- AlterTable
ALTER TABLE "public"."NotetakingAgentExecution" ADD COLUMN IF NOT EXISTS "model" TEXT,
ADD COLUMN IF NOT EXISTS "inputTokens" INTEGER,
ADD COLUMN IF NOT EXISTS "outputTokens" INTEGER,
ADD COLUMN IF NOT EXISTS "latencyMs" INTEGER;
