-- CreateTable
CREATE TABLE "public"."ReentryChecklistQuestion" (
    "pseudonymizedId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReentryChecklistQuestion_pkey" PRIMARY KEY ("pseudonymizedId","questionId")
);
