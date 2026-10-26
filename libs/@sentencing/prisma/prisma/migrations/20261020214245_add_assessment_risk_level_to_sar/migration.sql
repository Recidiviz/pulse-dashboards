-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" ADD COLUMN     "assessmentRiskLevel" "public"."DomainRiskLevel";

-- Backfill the risk level for reports that already have an ORAS score. The
-- import only sets it on reports that aren't complete and weren't entered by
-- hand, so without this those reports would have no level and no insight.
-- Thresholds are the lowest MODERATE and HIGH overall scores for each
-- assessment type, by gender, matching SCORE_BUCKET_BOUNDARIES in
-- assessmentTypeUtils.ts. Any gender other than FEMALE uses the male norms.
UPDATE "public"."SentencingAssessmentReport" AS sar
SET "assessmentRiskLevel" = (
  CASE
    WHEN sar."assessmentScore" >= t.high THEN 'HIGH'
    WHEN sar."assessmentScore" >= t.moderate THEN 'MODERATE'
    ELSE 'LOW'
  END
)::"public"."DomainRiskLevel"
FROM "public"."Client" AS c,
  (VALUES
    ('ORAS_CST', 'MALE', 15, 24),
    ('ORAS_CST', 'FEMALE', 15, 29),
    ('ORAS_SRT', 'MALE', 15, 21),
    ('ORAS_SRT', 'FEMALE', 14, 22),
    ('ORAS_PIT', 'MALE', 9, 17),
    ('ORAS_PIT', 'FEMALE', 13, 19),
    ('ORAS_RT', 'MALE', 10, 16),
    ('ORAS_RT', 'FEMALE', 11, 15)
  ) AS t (assessment_type, gender, moderate, high)
WHERE c."externalId" = sar."clientId"
  AND sar."assessmentScore" IS NOT NULL
  AND t.assessment_type = sar."assessmentType"::text
  AND t.gender = CASE WHEN c."gender"::text = 'FEMALE' THEN 'FEMALE' ELSE 'MALE' END;
