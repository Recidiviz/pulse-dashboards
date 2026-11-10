-- AlterTable
ALTER TABLE "public"."HousingApplication" ADD COLUMN     "duplicatedFromId" TEXT;

-- CreateIndex
CREATE INDEX "HousingApplication_duplicatedFromId_idx" ON "public"."HousingApplication"("duplicatedFromId");

-- AddForeignKey
ALTER TABLE "public"."HousingApplication" ADD CONSTRAINT "HousingApplication_duplicatedFromId_fkey" FOREIGN KEY ("duplicatedFromId") REFERENCES "public"."HousingApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
