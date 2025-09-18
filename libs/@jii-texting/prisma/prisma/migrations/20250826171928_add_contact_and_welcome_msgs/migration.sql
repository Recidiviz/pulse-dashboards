-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'REMINDER_TEXT';

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "receivedWelcomeText" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "officerName" TEXT NOT NULL,
    "reminderType" TEXT,
    "personStableExternalId" TEXT NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactReminderMessageAttempt" (
    "id" TEXT NOT NULL,
    "twilioMessageSid" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "status" "MessageAttemptStatus" NOT NULL,
    "createdTimestamp" TIMESTAMP(3) NOT NULL,
    "lastUpdatedTimestamp" TIMESTAMP(3),
    "twilioSentTimestamp" TIMESTAMP(3),
    "requestedSendTimestamp" TIMESTAMP(3),
    "error" TEXT,
    "errorCode" INTEGER,
    "messageSeriesId" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,

    CONSTRAINT "ContactReminderMessageAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactReminderMessageSeries" (
    "id" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "personExternalId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,

    CONSTRAINT "ContactReminderMessageSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelcomeMessageAttempt" (
    "id" TEXT NOT NULL,
    "twilioMessageSid" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "status" "MessageAttemptStatus" NOT NULL,
    "createdTimestamp" TIMESTAMP(3) NOT NULL,
    "lastUpdatedTimestamp" TIMESTAMP(3),
    "twilioSentTimestamp" TIMESTAMP(3),
    "requestedSendTimestamp" TIMESTAMP(3),
    "error" TEXT,
    "errorCode" INTEGER,
    "messageSeriesId" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,

    CONSTRAINT "WelcomeMessageAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelcomeMessageSeries" (
    "id" TEXT NOT NULL,
    "personExternalId" TEXT NOT NULL,

    CONSTRAINT "WelcomeMessageSeries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContactReminderMessageAttempt_twilioMessageSid_key" ON "ContactReminderMessageAttempt"("twilioMessageSid");

-- CreateIndex
CREATE UNIQUE INDEX "WelcomeMessageAttempt_twilioMessageSid_key" ON "WelcomeMessageAttempt"("twilioMessageSid");

-- CreateIndex
CREATE UNIQUE INDEX "WelcomeMessageSeries_personExternalId_key" ON "WelcomeMessageSeries"("personExternalId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_personStableExternalId_fkey" FOREIGN KEY ("personStableExternalId") REFERENCES "Person"("stableExternalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactReminderMessageAttempt" ADD CONSTRAINT "ContactReminderMessageAttempt_messageSeriesId_fkey" FOREIGN KEY ("messageSeriesId") REFERENCES "ContactReminderMessageSeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactReminderMessageAttempt" ADD CONSTRAINT "ContactReminderMessageAttempt_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactReminderMessageSeries" ADD CONSTRAINT "ContactReminderMessageSeries_personExternalId_fkey" FOREIGN KEY ("personExternalId") REFERENCES "Person"("stableExternalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactReminderMessageSeries" ADD CONSTRAINT "ContactReminderMessageSeries_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelcomeMessageAttempt" ADD CONSTRAINT "WelcomeMessageAttempt_messageSeriesId_fkey" FOREIGN KEY ("messageSeriesId") REFERENCES "WelcomeMessageSeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelcomeMessageAttempt" ADD CONSTRAINT "WelcomeMessageAttempt_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelcomeMessageSeries" ADD CONSTRAINT "WelcomeMessageSeries_personExternalId_fkey" FOREIGN KEY ("personExternalId") REFERENCES "Person"("stableExternalId") ON DELETE RESTRICT ON UPDATE CASCADE;
