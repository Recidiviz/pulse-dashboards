/*
  Warnings:

  - You are about to drop the column `static9RRCompleted` on the `SentencingAssessmentReport` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" DROP COLUMN "static9RRCompleted",
ADD COLUMN     "static99RCompleted" BOOLEAN NOT NULL DEFAULT false;
