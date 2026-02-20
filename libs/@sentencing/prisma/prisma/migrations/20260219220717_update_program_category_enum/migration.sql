/*
  Warnings:

  - The values [EducationProgram,CognitiveProgram] on the enum `TreatmentProgramCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."TreatmentProgramCategory_new" AS ENUM ('Anger', 'CareerTechnical', 'Cognitive', 'College', 'CommunityPartnership', 'CommunityTreatment', 'Education', 'FaithBased', 'InstitutionalTreatment', 'LifeSkills', 'Parenting', 'ReEntry', 'SexOffender', 'ShockIncarceration');
ALTER TABLE "public"."DOCTreatmentHistory" ALTER COLUMN "programCategory" TYPE "public"."TreatmentProgramCategory_new" USING ("programCategory"::text::"public"."TreatmentProgramCategory_new");
ALTER TYPE "public"."TreatmentProgramCategory" RENAME TO "TreatmentProgramCategory_old";
ALTER TYPE "public"."TreatmentProgramCategory_new" RENAME TO "TreatmentProgramCategory";
DROP TYPE "public"."TreatmentProgramCategory_old";
COMMIT;
