/*
  Warnings:

  - The values [AL,AK,AZ,AR,CA,CO,CT,DE,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY] on the enum `StateCode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StateCode_new" AS ENUM ('US_AL', 'US_AK', 'US_AZ', 'US_AR', 'US_CA', 'US_CO', 'US_CT', 'US_DE', 'US_FL', 'US_GA', 'US_HI', 'US_ID', 'US_IL', 'US_IN', 'US_IA', 'US_KS', 'US_KY', 'US_LA', 'US_ME', 'US_MD', 'US_MA', 'US_MI', 'US_MN', 'US_MS', 'US_MO', 'US_MT', 'US_NE', 'US_NV', 'US_NH', 'US_NJ', 'US_NM', 'US_NY', 'US_NC', 'US_ND', 'US_OH', 'US_OK', 'US_OR', 'US_PA', 'US_RI', 'US_SC', 'US_SD', 'US_TN', 'US_TX', 'US_UT', 'US_VT', 'US_VA', 'US_WA', 'US_WV', 'US_WI', 'US_WY');
ALTER TABLE "Staff" ALTER COLUMN "stateCode" TYPE "StateCode_new" USING ("stateCode"::text::"StateCode_new");
ALTER TABLE "Client" ALTER COLUMN "stateCode" TYPE "StateCode_new" USING ("stateCode"::text::"StateCode_new");
ALTER TABLE "Case" ALTER COLUMN "stateCode" TYPE "StateCode_new" USING ("stateCode"::text::"StateCode_new");
ALTER TYPE "StateCode" RENAME TO "StateCode_old";
ALTER TYPE "StateCode_new" RENAME TO "StateCode";
DROP TYPE "StateCode_old";
COMMIT;

-- AlterTable
ALTER TABLE "Case" ALTER COLUMN "lsirLevel" DROP NOT NULL;
