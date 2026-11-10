-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('SELECTED_AS_HOME_PLAN');

-- CreateTable
CREATE TABLE "public"."Alert" (
    "id" TEXT NOT NULL,
    "type" "public"."AlertType" NOT NULL,
    "applicationId" TEXT NOT NULL,
    "providerId" TEXT,
    "staffPseudonymizedId" TEXT,
    "dismissedAt" TIMESTAMP(3),
    "dismissedByPseudonymizedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Alert_applicationId_providerId_idx" ON "public"."Alert"("applicationId", "providerId");

-- CreateIndex
CREATE INDEX "Alert_applicationId_staffPseudonymizedId_idx" ON "public"."Alert"("applicationId", "staffPseudonymizedId");

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."HousingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."HousingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Exactly one recipient per row; Prisma cannot express this.
ALTER TABLE "public"."Alert"
  ADD CONSTRAINT "Alert_exactly_one_recipient"
  CHECK (num_nonnulls("providerId", "staffPseudonymizedId") = 1);
