/*
  Warnings:

  - You are about to drop the column `cniRunIds` on the `CaseNoteInsightsSummary` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."CaseNoteInsightsSummary" DROP COLUMN "cniRunIds";
