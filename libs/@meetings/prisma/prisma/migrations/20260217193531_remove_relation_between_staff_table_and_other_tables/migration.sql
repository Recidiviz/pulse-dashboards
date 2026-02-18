/*
  Warnings:

  - You are about to drop the column `staffId` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the `ClientsToStaff` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `staffEmail` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ClientsToStaff" DROP CONSTRAINT "ClientsToStaff_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClientsToStaff" DROP CONSTRAINT "ClientsToStaff_staffId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Meeting" DROP CONSTRAINT "Meeting_staffId_fkey";

-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "staffEmails" TEXT[];

-- AlterTable
ALTER TABLE "public"."Meeting" DROP COLUMN "staffId",
ADD COLUMN     "staffEmail" TEXT NOT NULL DEFAULT 'test@recidiviz.org';

-- DropTable
DROP TABLE "public"."ClientsToStaff";
