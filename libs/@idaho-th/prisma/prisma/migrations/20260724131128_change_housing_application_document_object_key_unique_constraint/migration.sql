/*
  Warnings:

  - A unique constraint covering the columns `[applicationId,objectKey]` on the table `HousingApplicationDocument` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."HousingApplicationDocument_objectKey_key";

-- CreateIndex
CREATE UNIQUE INDEX "HousingApplicationDocument_applicationId_objectKey_key" ON "public"."HousingApplicationDocument"("applicationId", "objectKey");
