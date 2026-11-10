-- Data-only migration: converts HousingApplication.formData and
-- HousingApplication.rawAiResponse `preferredProviders` entries from provider
-- NAMES to provider IDs, matching the ID-only matching code shipping in the
-- same deploy (see PRD "Idaho TH: Match Preferred Providers by ID, Not
-- Name"). This must run atomically with that code — there is no runtime
-- fallback that still resolves names, so a gap between the two would drop
-- every application's preferences with no signal.
--
-- Per element: dropped if empty/whitespace-only. Otherwise, an element
-- already shaped like a UUID passes through unchanged (idempotent — a rerun
-- is a no-op for already-converted rows). Everything else is looked up by
-- case-insensitive, trimmed name equality against HousingProvider; a name
-- shared by multiple providers resolves to the lowest id (same tie-break as
-- the application code); a name matching no live provider is dropped
-- silently, with no audit trail, per design (see D12).
--
-- An application with no resolvable preferences ends with an empty array,
-- never null — downstream code expects formData.preferredProviders to always
-- be an array.

WITH provider_by_name AS (
  SELECT DISTINCT ON (lower(trim(hp."name")))
    lower(trim(hp."name")) AS normalized_name,
    hp."id" AS provider_id
  FROM "public"."HousingProvider" hp
  ORDER BY lower(trim(hp."name")), hp."id" ASC
),
resolved AS (
  SELECT
    ha."id" AS application_id,
    COALESCE(
      jsonb_agg(
        to_jsonb(
          CASE
            WHEN trim(raw.value) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              THEN trim(raw.value)
            ELSE pbn.provider_id
          END
        )
        ORDER BY raw.ord
      ) FILTER (
        WHERE trim(raw.value) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          OR pbn.provider_id IS NOT NULL
      ),
      '[]'::jsonb
    ) AS preferred_provider_ids
  FROM "public"."HousingApplication" ha
  LEFT JOIN LATERAL (
    SELECT e.value, e.ord
    FROM jsonb_array_elements_text(
      CASE
        WHEN jsonb_typeof(ha."formData" -> 'preferredProviders') = 'array'
          THEN ha."formData" -> 'preferredProviders'
        ELSE '[]'::jsonb
      END
    ) WITH ORDINALITY AS e(value, ord)
    WHERE trim(e.value) <> ''
  ) raw ON true
  LEFT JOIN provider_by_name pbn ON pbn.normalized_name = lower(trim(raw.value))
  GROUP BY ha."id"
)
UPDATE "public"."HousingApplication" ha
SET "formData" = jsonb_set(
  ha."formData",
  '{preferredProviders}',
  resolved.preferred_provider_ids,
  true
)
FROM resolved
WHERE ha."id" = resolved.application_id;

WITH provider_by_name AS (
  SELECT DISTINCT ON (lower(trim(hp."name")))
    lower(trim(hp."name")) AS normalized_name,
    hp."id" AS provider_id
  FROM "public"."HousingProvider" hp
  ORDER BY lower(trim(hp."name")), hp."id" ASC
),
resolved AS (
  SELECT
    ha."id" AS application_id,
    COALESCE(
      jsonb_agg(
        to_jsonb(
          CASE
            WHEN trim(raw.value) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              THEN trim(raw.value)
            ELSE pbn.provider_id
          END
        )
        ORDER BY raw.ord
      ) FILTER (
        WHERE trim(raw.value) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          OR pbn.provider_id IS NOT NULL
      ),
      '[]'::jsonb
    ) AS preferred_provider_ids
  FROM "public"."HousingApplication" ha
  LEFT JOIN LATERAL (
    SELECT e.value, e.ord
    FROM jsonb_array_elements_text(
      CASE
        WHEN jsonb_typeof(ha."rawAiResponse" -> 'preferredProviders') = 'array'
          THEN ha."rawAiResponse" -> 'preferredProviders'
        ELSE '[]'::jsonb
      END
    ) WITH ORDINALITY AS e(value, ord)
    WHERE trim(e.value) <> ''
  ) raw ON true
  LEFT JOIN provider_by_name pbn ON pbn.normalized_name = lower(trim(raw.value))
  WHERE ha."rawAiResponse" IS NOT NULL
  GROUP BY ha."id"
)
UPDATE "public"."HousingApplication" ha
SET "rawAiResponse" = jsonb_set(
  ha."rawAiResponse",
  '{preferredProviders}',
  resolved.preferred_provider_ids,
  true
)
FROM resolved
WHERE ha."id" = resolved.application_id;
