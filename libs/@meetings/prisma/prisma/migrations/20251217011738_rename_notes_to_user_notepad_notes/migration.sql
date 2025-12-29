/*
  Warnings:

  - You are about to drop the column `notes` on the `Meeting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Meeting" DROP COLUMN "notes",
ADD COLUMN     "userNotepadNotes" TEXT;
