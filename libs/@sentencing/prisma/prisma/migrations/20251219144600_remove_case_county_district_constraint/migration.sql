-- Drop the constraint that prevented both county and district from being set on Case
-- This allows cases to have both county (sentencing) and district (supervision) simultaneously
ALTER TABLE "Case" DROP CONSTRAINT "Case_countyId_districtId_check";
