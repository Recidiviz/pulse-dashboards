-- AlterEnum
ALTER TYPE "public"."ApplicationSubStage" ADD VALUE 'CONDITIONAL_APPROVAL_REVOKED';

-- AlterEnum
ALTER TYPE "public"."TimelineEventType" ADD VALUE 'PROVIDER_REVOKED_CONDITIONAL_APPROVAL';

-- AlterEnum: renamed for consistency with the sub-stage. No rows use it yet.
ALTER TYPE "public"."ThreadType" RENAME VALUE 'APPROVAL_REVOKED' TO 'CONDITIONAL_APPROVAL_REVOKED';
