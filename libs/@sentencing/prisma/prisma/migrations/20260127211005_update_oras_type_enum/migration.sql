-- AlterEnum
BEGIN;
CREATE TYPE "public"."AssessmentType_new" AS ENUM ('ORAS_CST', 'ORAS_SRT', 'ORAS_PIT', 'ORAS_RT', 'Other');
ALTER TABLE "public"."SentencingAssessmentReport" ALTER COLUMN "assessmentType" TYPE "public"."AssessmentType_new" USING ("assessmentType"::text::"public"."AssessmentType_new");
ALTER TYPE "public"."AssessmentType" RENAME TO "AssessmentType_old";
ALTER TYPE "public"."AssessmentType_new" RENAME TO "AssessmentType";
DROP TYPE "public"."AssessmentType_old";
COMMIT;
