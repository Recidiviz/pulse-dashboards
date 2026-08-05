-- CreateTable
CREATE TABLE "public"."CaseNoteInsightsSummary" (
    "id" TEXT NOT NULL,
    "stateCode" "public"."StateCode" NOT NULL,
    "clientId" BIGINT NOT NULL,
    "category" TEXT NOT NULL,
    "cniFields" JSONB NOT NULL,
    "cniRunIds" JSONB NOT NULL,
    "lastImportedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseNoteInsightsSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CaseNoteInsightsFeedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" BIGINT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "vote" "public"."OutputVoteValue" NOT NULL,
    "message" TEXT NOT NULL,
    "summariesSnapshot" JSONB NOT NULL,

    CONSTRAINT "CaseNoteInsightsFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaseNoteInsightsSummary_clientId_category_key" ON "public"."CaseNoteInsightsSummary"("clientId", "category");

-- AddForeignKey
ALTER TABLE "public"."CaseNoteInsightsSummary" ADD CONSTRAINT "CaseNoteInsightsSummary_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("personId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CaseNoteInsightsFeedback" ADD CONSTRAINT "CaseNoteInsightsFeedback_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("personId") ON DELETE RESTRICT ON UPDATE CASCADE;
