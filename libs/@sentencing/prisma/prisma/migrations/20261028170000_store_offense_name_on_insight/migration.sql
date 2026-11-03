-- DropForeignKey
ALTER TABLE "public"."Insight" DROP CONSTRAINT "Insight_offenseId_fkey";

-- DropIndex
DROP INDEX "public"."Insight_gender_offenseId_assessmentScoreBucketStart_assessm_key";

-- AlterTable
ALTER TABLE "public"."Insight" ADD COLUMN     "offenseName" TEXT,
ALTER COLUMN "offenseId" DROP NOT NULL;

-- Copy each existing insight's offense name over from its linked Offense.
UPDATE "public"."Insight" i
SET "offenseName" = o."name"
FROM "public"."Offense" o
WHERE i."offenseId" = o."id";

ALTER TABLE "public"."Insight" ALTER COLUMN "offenseName" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Insight_gender_offenseName_assessmentScoreBucketStart_asses_key" ON "public"."Insight"("gender", "offenseName", "assessmentScoreBucketStart", "assessmentScoreBucketEnd");

-- AddForeignKey
ALTER TABLE "public"."Insight" ADD CONSTRAINT "Insight_offenseId_fkey" FOREIGN KEY ("offenseId") REFERENCES "public"."Offense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SAR doesn't use Offense. Remove the rows the US_MO charge import created only
-- so insights had an Offense to link to. Existing US_MO insights keep their
-- offenseName and lose the link through ON DELETE SET NULL.
DELETE FROM "public"."Offense" WHERE "stateCode" = 'US_MO';
