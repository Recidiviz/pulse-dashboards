-- AlterTable
ALTER TABLE "Client"
ADD COLUMN     "countyId" TEXT,
ADD COLUMN     "districtId" TEXT;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Add constraint that both county and district can't be set
ALTER TABLE "Client"
ADD CONSTRAINT "Client_countyId_districtId_check" CHECK (
  ("countyId" IS NULL OR "districtId" IS NULL)
);

-- 3. Migrate string data over to relation data for county and district
UPDATE
  "Client"
SET
  "countyId" = (CASE
      WHEN "county" IS NULL THEN NULL
      ELSE (
    SELECT
      "id" 
    FROM
      "County"
    WHERE
      LOWER("name") = LOWER("Client"."county"))
  END
    );

UPDATE
  "Client"
SET
  "districtId" = (CASE
      WHEN "countyId" IS NOT NULL OR "district" IS NULL THEN NULL
      ELSE (
    SELECT
      "id"
    FROM
      "District"
    WHERE
      LOWER("name") = LOWER("Client"."district"))
  END
    );

-- 4. Drop old columns
ALTER TABLE "Client" DROP COLUMN "county",
DROP COLUMN "district";
