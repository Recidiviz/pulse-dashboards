-- CreateEnum
CREATE TYPE "StateCode" AS ENUM ('US_AL', 'US_AK', 'US_AZ', 'US_AR', 'US_CA', 'US_CO', 'US_CT', 'US_DE', 'US_FL', 'US_GA', 'US_HI', 'US_ID', 'US_IL', 'US_IN', 'US_IA', 'US_KS', 'US_KY', 'US_LA', 'US_ME', 'US_MD', 'US_MA', 'US_MI', 'US_MN', 'US_MS', 'US_MO', 'US_MT', 'US_NE', 'US_NV', 'US_NH', 'US_NJ', 'US_NM', 'US_NY', 'US_NC', 'US_ND', 'US_OH', 'US_OK', 'US_OR', 'US_PA', 'US_RI', 'US_SC', 'US_SD', 'US_TN', 'US_TX', 'US_UT', 'US_VT', 'US_VA', 'US_WA', 'US_WV', 'US_WI', 'US_WY');

-- CreateTable
CREATE TABLE "Staff" (
    "stateCode" "StateCode" NOT NULL,
    "staffId" BIGINT NOT NULL,
    "stableStaffExternalId" TEXT NOT NULL,
    "stableStaffExternalIdType" TEXT NOT NULL,
    "pseudonymizedId" TEXT NOT NULL,
    "givenNames" TEXT NOT NULL,
    "middleNames" TEXT,
    "surname" TEXT NOT NULL,
    "suffix" TEXT,
    "email" TEXT,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("staffId")
);

-- CreateTable
CREATE TABLE "Client" (
    "stateCode" "StateCode" NOT NULL,
    "personId" BIGINT NOT NULL,
    "stablePersonExternalId" TEXT NOT NULL,
    "stablePersonExternalIdType" TEXT NOT NULL,
    "pseudonymizedId" TEXT NOT NULL,
    "displayPersonExternalId" TEXT NOT NULL,
    "givenNames" TEXT NOT NULL,
    "middleNames" TEXT,
    "surname" TEXT NOT NULL,
    "suffix" TEXT,
    "birthDate" DATE NOT NULL,
    "lastKnownResidence" TEXT,
    "supervisionType" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("personId")
);

-- CreateTable
CREATE TABLE "ClientsToStaff" (
    "staffId" BIGINT NOT NULL,
    "clientId" BIGINT NOT NULL,

    CONSTRAINT "ClientsToStaff_pkey" PRIMARY KEY ("staffId","clientId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_pseudonymizedId_key" ON "Staff"("pseudonymizedId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_stableStaffExternalId_stableStaffExternalIdType_key" ON "Staff"("stableStaffExternalId", "stableStaffExternalIdType");

-- CreateIndex
CREATE UNIQUE INDEX "Client_pseudonymizedId_key" ON "Client"("pseudonymizedId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_stablePersonExternalId_stablePersonExternalIdType_key" ON "Client"("stablePersonExternalId", "stablePersonExternalIdType");

-- AddForeignKey
ALTER TABLE "ClientsToStaff" ADD CONSTRAINT "ClientsToStaff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("staffId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientsToStaff" ADD CONSTRAINT "ClientsToStaff_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("personId") ON DELETE RESTRICT ON UPDATE CASCADE;
