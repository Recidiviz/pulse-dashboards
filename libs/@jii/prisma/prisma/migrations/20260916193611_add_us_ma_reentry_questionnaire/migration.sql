-- CreateTable
CREATE TABLE "public"."UsMaReentryQuestionnaire" (
    "id" TEXT NOT NULL,
    "pseudonymizedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "answers" JSONB NOT NULL,

    CONSTRAINT "UsMaReentryQuestionnaire_pkey" PRIMARY KEY ("id")
);
