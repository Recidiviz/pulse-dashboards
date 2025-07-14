-- CreateEnum
CREATE TYPE "StateCode" AS ENUM ('US_AL', 'US_AK', 'US_AZ', 'US_AR', 'US_CA', 'US_CO', 'US_CT', 'US_DE', 'US_FL', 'US_GA', 'US_HI', 'US_ID', 'US_IL', 'US_IN', 'US_IA', 'US_KS', 'US_KY', 'US_LA', 'US_ME', 'US_MD', 'US_MA', 'US_MI', 'US_MN', 'US_MS', 'US_MO', 'US_MT', 'US_NE', 'US_NV', 'US_NH', 'US_NJ', 'US_NM', 'US_NY', 'US_NC', 'US_ND', 'US_OH', 'US_OK', 'US_OR', 'US_PA', 'US_RI', 'US_SC', 'US_SD', 'US_TN', 'US_TX', 'US_UT', 'US_VT', 'US_VA', 'US_WA', 'US_WV', 'US_WI', 'US_WY');

-- CreateTable
CREATE TABLE "Staff" (
    "staffId" TEXT NOT NULL,
    "pseudonymizedId" TEXT NOT NULL,
    "stateCode" "StateCode" NOT NULL,
    "givenNames" TEXT NOT NULL,
    "middleNames" TEXT,
    "surname" TEXT NOT NULL,
    "suffix" TEXT,
    "email" TEXT NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("staffId")
);

-- CreateTable
CREATE TABLE "Client" (
    "personId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "pseudonymizedId" TEXT NOT NULL,
    "stateCode" "StateCode" NOT NULL,
    "givenNames" TEXT NOT NULL,
    "middleNames" TEXT,
    "surname" TEXT NOT NULL,
    "suffix" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("personId")
);

-- CreateTable
CREATE TABLE "Intake" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "clientId" TEXT NOT NULL,

    CONSTRAINT "Intake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ClientToStaff" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClientToStaff_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_pseudonymizedId_key" ON "Staff"("pseudonymizedId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_externalId_key" ON "Client"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_pseudonymizedId_key" ON "Client"("pseudonymizedId");

-- CreateIndex
CREATE INDEX "_ClientToStaff_B_index" ON "_ClientToStaff"("B");

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("personId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientToStaff" ADD CONSTRAINT "_ClientToStaff_A_fkey" FOREIGN KEY ("A") REFERENCES "Client"("personId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientToStaff" ADD CONSTRAINT "_ClientToStaff_B_fkey" FOREIGN KEY ("B") REFERENCES "Staff"("staffId") ON DELETE CASCADE ON UPDATE CASCADE;
