-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "intakeEnabled" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "birthDate" SET DATA TYPE DATE;
