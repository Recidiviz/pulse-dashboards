-- CreateTable
CREATE TABLE "MandatoryMinimum" (
    "id" TEXT NOT NULL,
    "sentenceType" TEXT NOT NULL,
    "minimumSentenceLength" INTEGER,
    "maximumSentenceLength" INTEGER,
    "statuteNumber" TEXT,
    "statuteLink" TEXT,
    "offenseId" TEXT NOT NULL,

    CONSTRAINT "MandatoryMinimum_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MandatoryMinimum_offenseId_sentenceType_key" ON "MandatoryMinimum"("offenseId", "sentenceType");

-- AddForeignKey
ALTER TABLE "MandatoryMinimum" ADD CONSTRAINT "MandatoryMinimum_offenseId_fkey" FOREIGN KEY ("offenseId") REFERENCES "Offense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
