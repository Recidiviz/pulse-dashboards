-- =============================================================================
-- Generalize info requests into typed staff <-> provider threads, so new
-- communication concerns (revocation notes, chat) become a ThreadType value
-- instead of new tables.
--
--   HousingApplicationInfoRequest -> ProviderApplicationThread
--   InfoRequestMessage            -> ThreadMessage
--
-- Every statement is a RENAME or an additive change, so no rows are copied or
-- dropped. Constraints and indexes are renamed too: Postgres keeps their old
-- names on a table rename, and Prisma would otherwise drop and recreate them
-- in the next migration.
-- =============================================================================

-- Enums
ALTER TYPE "public"."InfoRequestSenderType" RENAME TO "MessageSenderType";
ALTER TYPE "public"."InfoRequestStatus" RENAME TO "ThreadStatus";
CREATE TYPE "public"."ThreadType" AS ENUM ('INFO_REQUEST', 'APPROVAL_REVOKED');

-- Thread table
ALTER TABLE "public"."HousingApplicationInfoRequest" RENAME TO "ProviderApplicationThread";
ALTER TABLE "public"."ProviderApplicationThread" RENAME CONSTRAINT "HousingApplicationInfoRequest_pkey" TO "ProviderApplicationThread_pkey";
ALTER TABLE "public"."ProviderApplicationThread" RENAME CONSTRAINT "HousingApplicationInfoRequest_providerApplicationId_fkey" TO "ProviderApplicationThread_providerApplicationId_fkey";
ALTER INDEX "public"."HousingApplicationInfoRequest_status_idx" RENAME TO "ProviderApplicationThread_status_idx";

-- Every existing row is an info request. The default only backfills them;
-- new threads must state their type.
ALTER TABLE "public"."ProviderApplicationThread" ADD COLUMN "type" "public"."ThreadType" NOT NULL DEFAULT 'INFO_REQUEST';
ALTER TABLE "public"."ProviderApplicationThread" ALTER COLUMN "type" DROP DEFAULT;

-- Only INFO_REQUEST threads have a lifecycle; informational threads leave
-- status null rather than silently defaulting to OPEN.
ALTER TABLE "public"."ProviderApplicationThread" ALTER COLUMN "status" DROP NOT NULL;
ALTER TABLE "public"."ProviderApplicationThread" ALTER COLUMN "status" DROP DEFAULT;

DROP INDEX "public"."HousingApplicationInfoRequest_providerApplicationId_idx";
CREATE INDEX "ProviderApplicationThread_providerApplicationId_type_idx" ON "public"."ProviderApplicationThread"("providerApplicationId", "type");

-- Message table
ALTER TABLE "public"."InfoRequestMessage" RENAME TO "ThreadMessage";
ALTER TABLE "public"."ThreadMessage" RENAME COLUMN "infoRequestId" TO "threadId";
ALTER TABLE "public"."ThreadMessage" RENAME CONSTRAINT "InfoRequestMessage_pkey" TO "ThreadMessage_pkey";
ALTER TABLE "public"."ThreadMessage" RENAME CONSTRAINT "InfoRequestMessage_infoRequestId_fkey" TO "ThreadMessage_threadId_fkey";
ALTER INDEX "public"."InfoRequestMessage_infoRequestId_createdAt_idx" RENAME TO "ThreadMessage_threadId_createdAt_idx";
ALTER INDEX "public"."InfoRequestMessage_readAt_idx" RENAME TO "ThreadMessage_readAt_idx";
