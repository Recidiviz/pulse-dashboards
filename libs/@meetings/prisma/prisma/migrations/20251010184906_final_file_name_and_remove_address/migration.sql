/*
  Warnings:

  - You are about to drop the column `address` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `finalRecordingUrl` on the `Meeting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Meeting" DROP COLUMN "address",
DROP COLUMN "finalRecordingUrl",
ADD COLUMN     "finalRecordingGCSPath" TEXT;
