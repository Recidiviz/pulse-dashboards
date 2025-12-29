-- DropForeignKey
ALTER TABLE "public"."Meeting" DROP CONSTRAINT "Meeting_clientId_fkey";

-- AlterTable
ALTER TABLE "public"."Meeting" ADD COLUMN     "residentId" BIGINT,
ALTER COLUMN "clientId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."Resident" (
    "stateCode" "public"."StateCode" NOT NULL,
    "personId" BIGINT NOT NULL,
    "stablePersonExternalId" TEXT NOT NULL,
    "stablePersonExternalIdType" TEXT NOT NULL,
    "pseudonymizedId" TEXT NOT NULL,
    "displayPersonExternalId" TEXT NOT NULL,
    "givenNames" TEXT NOT NULL,
    "middleNames" TEXT,
    "surname" TEXT NOT NULL,
    "suffix" TEXT,
    "facilityId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("personId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resident_stablePersonExternalId_stablePersonExternalIdType_key" ON "public"."Resident"("stablePersonExternalId", "stablePersonExternalIdType");

-- CreateIndex
CREATE UNIQUE INDEX "Resident_pseudonymizedId_stablePersonExternalIdType_key" ON "public"."Resident"("pseudonymizedId", "stablePersonExternalIdType");

-- AddForeignKey
ALTER TABLE "public"."Meeting" ADD CONSTRAINT "Meeting_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("personId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Meeting" ADD CONSTRAINT "Meeting_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("personId") ON DELETE SET NULL ON UPDATE CASCADE;
