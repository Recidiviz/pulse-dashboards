-- CreateEnum
CREATE TYPE "public"."NotetakingPipelineStatus" AS ENUM ('SUCCESS', 'PARTIAL_FAILURE', 'FAILURE', 'IN_PROGRESS');

-- CreateEnum
CREATE TYPE "public"."NotetakingAgentType" AS ENUM ('EXTRACTION', 'DRAFTING', 'VERIFICATION');

-- CreateTable
CREATE TABLE "public"."NotetakingPipelineRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meetingId" TEXT NOT NULL,
    "langsmithTraceId" TEXT,
    "personPseudonymizedId" TEXT NOT NULL,
    "status" "public"."NotetakingPipelineStatus" NOT NULL,
    "errorDetails" JSONB,

    CONSTRAINT "NotetakingPipelineRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotetakingAgentExecution" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pipelineRunId" TEXT NOT NULL,
    "agentType" "public"."NotetakingAgentType" NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "outputData" JSONB NOT NULL,
    "validationResult" JSONB NOT NULL,

    CONSTRAINT "NotetakingAgentExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotetakingAgentExecution_pipelineRunId_idx" ON "public"."NotetakingAgentExecution"("pipelineRunId");

-- AddForeignKey
ALTER TABLE "public"."NotetakingAgentExecution" ADD CONSTRAINT "NotetakingAgentExecution_pipelineRunId_fkey" FOREIGN KEY ("pipelineRunId") REFERENCES "public"."NotetakingPipelineRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
