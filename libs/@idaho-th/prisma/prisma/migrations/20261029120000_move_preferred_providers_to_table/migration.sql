-- CreateTable
CREATE TABLE "public"."PreferredHousingProvider" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "PreferredHousingProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PreferredHousingProvider_providerId_idx" ON "public"."PreferredHousingProvider"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "PreferredHousingProvider_applicationId_providerId_key" ON "public"."PreferredHousingProvider"("applicationId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "PreferredHousingProvider_applicationId_rank_key" ON "public"."PreferredHousingProvider"("applicationId", "rank");

-- AddForeignKey
ALTER TABLE "public"."PreferredHousingProvider" ADD CONSTRAINT "PreferredHousingProvider_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."HousingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PreferredHousingProvider" ADD CONSTRAINT "PreferredHousingProvider_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."HousingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Move formData.preferredProviders into the table above, then drop the key.
-- Per element: trimmed and matched to a live provider by id; anything that
-- doesn't match (a deleted provider's stale id, a name the 20260917 backfill
-- couldn't resolve, a blank slot) is dropped silently. A repeated id keeps its
-- first position, and ranks are renumbered 0..n-1 with no gaps. No cap at 3:
-- extractor output never passed the input schema's limit, so keep what exists.
-- rawAiResponse is left as is: it's the AI extraction snapshot, not live data.
INSERT INTO "public"."PreferredHousingProvider" ("id", "applicationId", "providerId", "rank")
SELECT
  gen_random_uuid()::text,
  preferred.application_id,
  preferred.provider_id,
  (row_number() OVER (PARTITION BY preferred.application_id ORDER BY preferred.first_ord) - 1)::int
FROM (
  SELECT ha."id" AS application_id, hp."id" AS provider_id, min(e.ord) AS first_ord
  FROM "public"."HousingApplication" ha
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(ha."formData" -> 'preferredProviders') = 'array'
        THEN ha."formData" -> 'preferredProviders'
      ELSE '[]'::jsonb
    END
  ) WITH ORDINALITY AS e(value, ord)
  JOIN "public"."HousingProvider" hp
    ON jsonb_typeof(e.value) = 'string' AND hp."id" = trim(e.value #>> '{}')
  GROUP BY ha."id", hp."id"
) preferred;

UPDATE "public"."HousingApplication"
SET "formData" = "formData" - 'preferredProviders'
WHERE jsonb_typeof("formData") = 'object' AND "formData" ? 'preferredProviders';
