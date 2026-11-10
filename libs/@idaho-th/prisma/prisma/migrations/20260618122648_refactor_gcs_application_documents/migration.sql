/*
  Warnings:

  - You are about to drop the `GcsPdfFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ApplicationIntakeStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "public"."HousingApplicationDocumentUploader" AS ENUM ('STAFF', 'PROVIDER');

-- CreateEnum
CREATE TYPE "public"."HousingApplicationDocumentType" AS ENUM ('HANDWRITTEN_SOURCE', 'DIGITIZED', 'ATTACHMENT');

-- AlterTable
ALTER TABLE "public"."StaffHousingApplication" ADD COLUMN     "intakeStatus" "public"."ApplicationIntakeStatus" NOT NULL DEFAULT 'DRAFT';

-- DropTable
DROP TABLE "public"."GcsPdfFile";

-- DropEnum
DROP TYPE "public"."GcsUploadStatus";

-- CreateTable
CREATE TABLE "public"."HousingApplicationDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "uploadedByType" "public"."HousingApplicationDocumentUploader" NOT NULL,
    "uploadedByPseudonymizedId" TEXT NOT NULL,
    "documentType" "public"."HousingApplicationDocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HousingApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HousingApplicationDocument_applicationId_createdAt_idx" ON "public"."HousingApplicationDocument"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "HousingApplicationDocument_uploadedByType_uploadedByPseudon_idx" ON "public"."HousingApplicationDocument"("uploadedByType", "uploadedByPseudonymizedId");

-- CreateIndex
CREATE UNIQUE INDEX "HousingApplicationDocument_bucketName_objectKey_key" ON "public"."HousingApplicationDocument"("bucketName", "objectKey");

-- AddForeignKey
ALTER TABLE "public"."HousingApplicationDocument" ADD CONSTRAINT "HousingApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."HousingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
