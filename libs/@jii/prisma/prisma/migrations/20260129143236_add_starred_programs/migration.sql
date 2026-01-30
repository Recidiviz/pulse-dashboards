-- CreateTable
CREATE TABLE "public"."UsCoStarredProgram" (
    "pseudonymizedId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsCoStarredProgram_pkey" PRIMARY KEY ("pseudonymizedId","programId","title")
);
