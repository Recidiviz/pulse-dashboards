/*
  Warnings:

  - The primary key for the `Client` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ClientsToStaff` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Staff` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "ClientsToStaff" DROP CONSTRAINT "ClientsToStaff_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ClientsToStaff" DROP CONSTRAINT "ClientsToStaff_staffId_fkey";

-- DropForeignKey
ALTER TABLE "Intake" DROP CONSTRAINT "Intake_clientId_fkey";

-- AlterTable
ALTER TABLE "Client" DROP CONSTRAINT "Client_pkey",
ALTER COLUMN "personId" SET DATA TYPE BIGINT,
ADD CONSTRAINT "Client_pkey" PRIMARY KEY ("personId");

-- AlterTable
ALTER TABLE "ClientsToStaff" DROP CONSTRAINT "ClientsToStaff_pkey",
ALTER COLUMN "staffId" SET DATA TYPE BIGINT,
ALTER COLUMN "clientId" SET DATA TYPE BIGINT,
ADD CONSTRAINT "ClientsToStaff_pkey" PRIMARY KEY ("staffId", "clientId");

-- AlterTable
ALTER TABLE "Intake" ALTER COLUMN "clientId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_pkey",
ALTER COLUMN "staffId" SET DATA TYPE BIGINT,
ADD CONSTRAINT "Staff_pkey" PRIMARY KEY ("staffId");

-- AddForeignKey
ALTER TABLE "ClientsToStaff" ADD CONSTRAINT "ClientsToStaff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("staffId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientsToStaff" ADD CONSTRAINT "ClientsToStaff_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("personId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("personId") ON DELETE RESTRICT ON UPDATE CASCADE;
