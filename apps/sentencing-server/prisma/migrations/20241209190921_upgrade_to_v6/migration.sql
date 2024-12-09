-- AlterTable
ALTER TABLE "_CaseToOpportunity" ADD CONSTRAINT "_CaseToOpportunity_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CaseToOpportunity_AB_unique";
