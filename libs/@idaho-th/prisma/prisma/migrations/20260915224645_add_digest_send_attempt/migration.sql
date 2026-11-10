-- CreateEnum
CREATE TYPE "public"."DigestRecipientAudience" AS ENUM ('PROVIDER', 'STAFF');

-- CreateEnum
CREATE TYPE "public"."DigestSendOutcome" AS ENUM ('SENT', 'FAILED');

-- CreateTable
CREATE TABLE "public"."DigestSendAttempt" (
    "id" TEXT NOT NULL,
    "audience" "public"."DigestRecipientAudience" NOT NULL,
    "recipientId" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" "public"."DigestSendOutcome" NOT NULL,
    "errorCode" TEXT,
    "intercomContactId" TEXT,
    "isRetry" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DigestSendAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DigestSendAttempt_recipientId_attemptedAt_idx" ON "public"."DigestSendAttempt"("recipientId", "attemptedAt");
