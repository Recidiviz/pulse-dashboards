/*
  Warnings:

  - You are about to drop the column `completed` on the `UsNcRNA` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."UsNcRNA" ADD COLUMN "completedAt" TIMESTAMP(3);

-- data migration for dropped column, not generated code
UPDATE "public"."UsNcRNA" t
-- best proxy for this value in past records
SET "completedAt" = t."updatedAt"
WHERE t."completed";

-- more generated code
-- AlterTable
ALTER TABLE "public"."UsNcRNA" DROP COLUMN "completed";
