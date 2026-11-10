-- AlterTable
ALTER TABLE "HousingApplication" ADD COLUMN "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT now();

-- Backfill: use the most recent timeline event as the source of truth for
-- existing rows, falling back to the application's own createdAt when it has
-- no timeline events yet.
UPDATE "HousingApplication" AS app
SET "lastActivityAt" = COALESCE(
  (
    SELECT MAX(event."createdAt")
    FROM "HousingApplicationTimelineEvent" AS event
    WHERE event."applicationId" = app."id"
  ),
  app."createdAt"
);

-- CreateIndex
CREATE INDEX "HousingApplication_lastActivityAt_idx" ON "HousingApplication"("lastActivityAt");