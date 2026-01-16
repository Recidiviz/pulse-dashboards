/*
  Warnings:

  - You are about to drop the `ReentryChecklistQuestion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."ReentryChecklistQuestion";

-- CreateTable
CREATE TABLE "public"."usNeReentryChecklistQuestion" (
    "pseudonymizedId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usNeReentryChecklistQuestion_pkey" PRIMARY KEY ("pseudonymizedId","questionId")
);
