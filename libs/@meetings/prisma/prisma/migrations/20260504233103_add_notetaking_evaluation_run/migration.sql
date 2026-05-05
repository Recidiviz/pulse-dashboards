-- CreateTable
CREATE TABLE "public"."NotetakingEvaluationRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pipelineRunId" TEXT NOT NULL,
    "evaluatorVersion" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "langsmithTraceId" TEXT,

    CONSTRAINT "NotetakingEvaluationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotetakingEvaluationRun_pipelineRunId_idx" ON "public"."NotetakingEvaluationRun"("pipelineRunId");

-- CreateIndex
CREATE INDEX "NotetakingEvaluationRun_evaluatorVersion_idx" ON "public"."NotetakingEvaluationRun"("evaluatorVersion");

-- AddForeignKey
ALTER TABLE "public"."NotetakingEvaluationRun" ADD CONSTRAINT "NotetakingEvaluationRun_pipelineRunId_fkey" FOREIGN KEY ("pipelineRunId") REFERENCES "public"."NotetakingPipelineRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
