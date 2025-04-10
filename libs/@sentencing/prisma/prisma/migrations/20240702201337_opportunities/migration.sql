-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "opportunityName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "providerPhoneNumber" TEXT NOT NULL,
    "providerWebsite" TEXT NOT NULL,
    "providerAddress" TEXT NOT NULL,
    "totalCapacity" INTEGER NOT NULL,
    "availableCapacity" INTEGER NOT NULL,
    "needsAddressed" "NeedToBeAddressed"[],

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CaseToOpportunity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_opportunityName_providerPhoneNumber_key" ON "Opportunity"("opportunityName", "providerPhoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "_CaseToOpportunity_AB_unique" ON "_CaseToOpportunity"("A", "B");

-- CreateIndex
CREATE INDEX "_CaseToOpportunity_B_index" ON "_CaseToOpportunity"("B");

-- AddForeignKey
ALTER TABLE "_CaseToOpportunity" ADD CONSTRAINT "_CaseToOpportunity_A_fkey" FOREIGN KEY ("A") REFERENCES "Case"("externalId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CaseToOpportunity" ADD CONSTRAINT "_CaseToOpportunity_B_fkey" FOREIGN KEY ("B") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
