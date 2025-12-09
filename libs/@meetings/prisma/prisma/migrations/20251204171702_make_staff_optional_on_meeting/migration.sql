-- DropForeignKey
ALTER TABLE "public"."Meeting" DROP CONSTRAINT "Meeting_staffId_fkey";

-- AlterTable
ALTER TABLE "public"."Meeting" ALTER COLUMN "staffId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Meeting" ADD CONSTRAINT "Meeting_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("staffId") ON DELETE SET NULL ON UPDATE CASCADE;
