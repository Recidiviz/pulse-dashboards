-- CreateTable
CREATE TABLE "public"."UsNeCheckIn" (
    "id" TEXT NOT NULL,
    "pseudonymizedId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "answers" JSONB NOT NULL,

    CONSTRAINT "UsNeCheckIn_pkey" PRIMARY KEY ("id")
);
