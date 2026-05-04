-- CreateTable
CREATE TABLE "public"."UsNcRNAWritebackData" (
    "pseudonymizedId" TEXT NOT NULL,
    "opusId" TEXT NOT NULL,
    "seqNumber" TEXT,
    "admitDate" TIMESTAMP(3),
    "importedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UsNcRNAWritebackData_pseudonymizedId_key" ON "public"."UsNcRNAWritebackData"("pseudonymizedId");
