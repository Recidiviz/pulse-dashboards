-- DropForeignKey
ALTER TABLE "County" DROP CONSTRAINT "County_districtId_fkey";

-- AlterTable
ALTER TABLE "Case"
ADD COLUMN     "countyId" TEXT,
ADD COLUMN     "districtId" TEXT;

-- AlterTable
ALTER TABLE "County" ALTER COLUMN "districtId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "County" ADD CONSTRAINT "County_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Add constraint that both county and district can't be set
ALTER TABLE "Case"
ADD CONSTRAINT "Case_countyId_districtId_check" CHECK (
  ("countyId" IS NULL OR "districtId" IS NULL)
);

-- 3. Migrate string data over to relation data for county and district
UPDATE
  "Case"
SET
  "countyId" = (CASE
      WHEN "county" IS NULL THEN NULL
      ELSE (
    SELECT
      "id" 
    FROM
      "County"
    WHERE
      LOWER("name") = LOWER("Case"."county"))
  END
    );

UPDATE
  "Case"
SET
  "districtId" = (CASE
      WHEN "countyId" IS NOT NULL OR "district" IS NULL THEN NULL
      ELSE (
    SELECT
      "id"
    FROM
      "District"
    WHERE
      LOWER("name") = LOWER("Case"."district"))
  END
    );

-- 4. Drop old columns
ALTER TABLE "Case" DROP COLUMN "county",
DROP COLUMN "district";
