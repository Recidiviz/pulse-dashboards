/*
  Warnings:

  - The primary key for the `Contact` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `officerName` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Contact` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[externalId]` on the table `Contact` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contactingOfficerId` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactingPoName` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `externalId` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locationType` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `method` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updateDatetime` to the `Contact` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ContactReminderMessageSeries" DROP CONSTRAINT "ContactReminderMessageSeries_contactId_fkey";

-- AlterTable
ALTER TABLE "public"."Contact" DROP CONSTRAINT "Contact_pkey",
DROP COLUMN "id",
DROP COLUMN "officerName",
DROP COLUMN "type",
ADD COLUMN     "contactingOfficerId" TEXT NOT NULL,
ADD COLUMN     "contactingPoName" TEXT NOT NULL,
ADD COLUMN     "externalId" TEXT NOT NULL,
ADD COLUMN     "locationType" TEXT NOT NULL,
ADD COLUMN     "method" TEXT NOT NULL,
ADD COLUMN     "updateDatetime" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Contact_externalId_key" ON "public"."Contact"("externalId");

-- AddForeignKey
ALTER TABLE "public"."ContactReminderMessageSeries" ADD CONSTRAINT "ContactReminderMessageSeries_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("externalId") ON DELETE RESTRICT ON UPDATE CASCADE;
