-- CreateTable
CREATE TABLE "public"."Resident" (
    "personId" INTEGER NOT NULL,
    "pseudonymizedId" TEXT NOT NULL,
    "personExternalId" TEXT NOT NULL,
    "displayId" TEXT NOT NULL,
    "givenNames" TEXT,
    "middleNames" TEXT,
    "surname" TEXT,
    "facilityId" TEXT,
    "unitId" TEXT,
    "stateSpecificData" JSONB NOT NULL,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("pseudonymizedId")
);
