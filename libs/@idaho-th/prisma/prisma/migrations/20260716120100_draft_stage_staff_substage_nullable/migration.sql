-- AlterTable: allow null subStage on staff applications (drafts have no substage)
ALTER TABLE "public"."StaffHousingApplication" ALTER COLUMN "subStage" DROP NOT NULL;
ALTER TABLE "public"."StaffHousingApplication" ALTER COLUMN "subStage" DROP DEFAULT;
ALTER TABLE "public"."StaffHousingApplication" ALTER COLUMN "stage" SET DEFAULT 'DRAFT';

-- Backfill existing drafts to the new draft stage/substage/status invariant
UPDATE "public"."StaffHousingApplication"
SET
  stage = 'DRAFT',
  "subStage" = NULL,
  status = 'ACTION_NEEDED'
WHERE "intakeStatus" = 'DRAFT';
