-- DOCUMENT_UPLOADED timeline events never carried the uploaded file's name, so
-- every existing row reads "Document uploaded" or "<Provider> uploaded a
-- document". Going forward the event carries fileName and the description
-- reads "Document <file> uploaded" / "<Provider> uploaded <file>" (see
-- timeline.descriptions.ts). This backfills the old rows to match.
--
-- There is no FK from a timeline event to the document it describes, so each
-- event is paired with a document by matching applicationId +
-- actorPseudonymizedId (== uploadedByPseudonymizedId) + scopedProviderId,
-- then pairing the Nth-oldest event in that group with the Nth-oldest
-- CONFIRMED document in the same group (events and confirmed uploads are
-- created 1:1 in the same transaction, so ordering by createdAt within the
-- group recovers the pairing). A document deleted since upload breaks the
-- count for every later event in its group; those rows are left as-is rather
-- than guessed at.
--
-- The WHERE clause only touches rows still in one of the two pre-fileName
-- formats, so this is idempotent / safe to re-run.

CREATE TEMP TABLE "_document_uploaded_backfill" AS
WITH ranked_events AS (
  SELECT
    e."id",
    e."description",
    ROW_NUMBER() OVER (
      PARTITION BY e."applicationId", e."actorPseudonymizedId", e."scopedProviderId"
      ORDER BY e."createdAt"
    ) AS rn
  FROM "HousingApplicationTimelineEvent" e
  WHERE e."eventType" = 'DOCUMENT_UPLOADED'
    AND (e."description" = 'Document uploaded' OR e."description" LIKE '% uploaded a document')
),
ranked_documents AS (
  SELECT
    d."id",
    d."applicationId",
    d."uploadedByPseudonymizedId",
    d."scopedProviderId",
    d."documentType",
    d."fileName",
    ha."clientName",
    ROW_NUMBER() OVER (
      PARTITION BY d."applicationId", d."uploadedByPseudonymizedId", d."scopedProviderId"
      ORDER BY d."createdAt"
    ) AS rn
  FROM "HousingApplicationDocument" d
  JOIN "HousingApplication" ha ON ha."id" = d."applicationId"
  WHERE d."status" = 'CONFIRMED'
),
display_file_names AS (
  SELECT
    rd."applicationId",
    rd."uploadedByPseudonymizedId",
    rd."scopedProviderId",
    rd."rn",
    CASE rd."documentType"
      WHEN 'HANDWRITTEN_SOURCE' THEN COALESCE(NULLIF(rd."clientName", ''), 'application') || '_handwritten-application.pdf'
      WHEN 'DIGITIZED' THEN COALESCE(NULLIF(rd."clientName", ''), 'application') || '_digitized-application.pdf'
      ELSE rd."fileName"
    END AS "rawDisplayFileName"
  FROM ranked_documents rd
)
SELECT
  re."id" AS "eventId",
  re."description" AS "oldDescription",
  NULLIF(
    BTRIM(
      LEFT(
        BTRIM(REGEXP_REPLACE(REGEXP_REPLACE(dfn."rawDisplayFileName", '[/\\]+', ' ', 'g'), '\s+', ' ', 'g')),
        200
      )
    ),
    ''
  ) AS "sanitizedFileName"
FROM ranked_events re
JOIN "HousingApplicationTimelineEvent" e ON e."id" = re."id"
JOIN display_file_names dfn
  ON dfn."applicationId" = e."applicationId"
  AND dfn."uploadedByPseudonymizedId" = e."actorPseudonymizedId"
  AND dfn."scopedProviderId" IS NOT DISTINCT FROM e."scopedProviderId"
  AND dfn."rn" = re."rn";

UPDATE "HousingApplicationTimelineEvent" e
SET "description" = CASE
  WHEN b."oldDescription" = 'Document uploaded'
    THEN 'Document ' || COALESCE(b."sanitizedFileName", 'document') || ' uploaded'
  ELSE LEFT(b."oldDescription", LENGTH(b."oldDescription") - LENGTH(' uploaded a document'))
    || ' uploaded ' || COALESCE(b."sanitizedFileName", 'document')
END
FROM "_document_uploaded_backfill" b
WHERE e."id" = b."eventId";

DROP TABLE "_document_uploaded_backfill";
