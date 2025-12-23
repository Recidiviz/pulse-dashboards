-- Drop the constraint that prevented both county and district from being set
-- This allows US_ID clients to have both county (residence) and district (supervision) simultaneously
ALTER TABLE "Client" DROP CONSTRAINT "Client_countyId_districtId_check";
