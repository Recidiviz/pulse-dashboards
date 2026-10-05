-- CreateTable
CREATE TABLE "public"."UsMaReentryChecklistItemState" (
    "pseudonymizedId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsMaReentryChecklistItemState_pkey" PRIMARY KEY ("pseudonymizedId","itemId")
);
