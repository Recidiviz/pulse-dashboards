-- CreateEnum
CREATE TYPE "StateCode" AS ENUM ('AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY');

-- CreateEnum
CREATE TYPE "Charge" AS ENUM ('Misdemeanor', 'Felony');

-- CreateEnum
CREATE TYPE "Pronouns" AS ENUM ('HeHim', 'SheHer', 'TheyThem');

-- CreateEnum
CREATE TYPE "VeteranStatus" AS ENUM ('Veteran', 'NonVeteran');

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "stateCode" "StateCode" NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "stateCode" "StateCode" NOT NULL,
    "staffId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completionDate" TIMESTAMP(3) NOT NULL,
    "sentenceDate" TIMESTAMP(3) NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL,
    "countyName" TEXT NOT NULL,
    "lsirScore" TEXT NOT NULL,
    "lsirLevel" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "charge" "Charge" NOT NULL,
    "pronouns" "Pronouns" NOT NULL,
    "veteranStatus" "VeteranStatus" NOT NULL,
    "previouslyIncarcerated" BOOLEAN NOT NULL,
    "previouslyUnderSupervision" BOOLEAN NOT NULL,
    "hasPreviousFelonyConviction" BOOLEAN NOT NULL,
    "hasPreviousViolentOffenseConviction" BOOLEAN NOT NULL,
    "hasPreviousSexOffenseConviction" BOOLEAN NOT NULL,
    "previousTreatmentCourtParticipation" BOOLEAN NOT NULL,
    "hasSubstanceAbuseDisorderDiagnosis" BOOLEAN NOT NULL,
    "isOpenChildProtectiveServicesCase" BOOLEAN NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_externalId_key" ON "Staff"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_externalId_key" ON "Client"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Case_externalId_key" ON "Case"("externalId");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
