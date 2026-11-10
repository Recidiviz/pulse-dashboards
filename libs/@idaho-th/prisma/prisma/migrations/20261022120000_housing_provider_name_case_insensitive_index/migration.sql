-- Two providers whose names differ only by case ("Acme Housing" /
-- "ACME Housing") are the same organization. The plain "name" unique
-- constraint stays: the seed upserts on it, and Prisma needs a unique to
-- target. This index adds the case-insensitive rule on top. Names are already
-- trimmed by every writer (Zod on rename, the seed's CSV parsing).

-- Fail with the colliding names rather than a bare "could not create unique
-- index", so whoever runs this knows which providers to merge first.
DO $$
DECLARE
  collisions TEXT;
BEGIN
  SELECT string_agg(d."names", '; ')
    INTO collisions
    FROM (
      SELECT string_agg('"' || "name" || '"', ', ' ORDER BY "name") AS "names"
        FROM "public"."HousingProvider"
       GROUP BY lower("name")
      HAVING count(*) > 1
    ) d;

  IF collisions IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot add HousingProvider_name_lower_key: provider names collide when compared case-insensitively: %. Merge or rename these before migrating.',
      collisions;
  END IF;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX "HousingProvider_name_lower_key" ON "public"."HousingProvider" (lower("name"));
