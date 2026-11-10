-- CreateTable
CREATE TABLE "public"."AdminPanelDeletionLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityDisplayName" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPanelDeletionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminPanelDeletionLog_entityType_deletedAt_idx" ON "public"."AdminPanelDeletionLog"("entityType", "deletedAt");

-- CreateIndex
CREATE INDEX "AdminPanelDeletionLog_entityId_idx" ON "public"."AdminPanelDeletionLog"("entityId");
