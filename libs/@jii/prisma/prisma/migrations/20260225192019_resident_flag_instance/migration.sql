-- CreateTable
CREATE TABLE "public"."ResidentFlagInstance" (
    "pseudonymizedId" TEXT NOT NULL,
    "flagId" TEXT NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResidentFlagInstance_pkey" PRIMARY KEY ("pseudonymizedId","flagId")
);
