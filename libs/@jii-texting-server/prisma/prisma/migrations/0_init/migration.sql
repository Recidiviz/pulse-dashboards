-- CreateEnum
CREATE TYPE "StateCode" AS ENUM ('US_AL', 'US_AK', 'US_AZ', 'US_AR', 'US_CA', 'US_CO', 'US_CT', 'US_DE', 'US_FL', 'US_GA', 'US_HI', 'US_ID', 'US_IL', 'US_IN', 'US_IA', 'US_KS', 'US_KY', 'US_LA', 'US_ME', 'US_MD', 'US_MA', 'US_MI', 'US_MN', 'US_MS', 'US_MO', 'US_MT', 'US_NE', 'US_NV', 'US_NH', 'US_NJ', 'US_NM', 'US_NY', 'US_NC', 'US_ND', 'US_OH', 'US_OK', 'US_OR', 'US_PA', 'US_RI', 'US_SC', 'US_SD', 'US_TN', 'US_TX', 'US_UT', 'US_VT', 'US_VA', 'US_WA', 'US_WV', 'US_WI', 'US_WY');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('INITIAL_TEXT', 'ELIGIBILITY_TEXT');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MessageAttemptStatus" AS ENUM ('FAILURE', 'SUCCESS', 'IN_PROGRESS', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Person" (
    "externalId" TEXT NOT NULL,
    "pseudonymizedId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "stateCode" "StateCode" NOT NULL,
    "givenName" TEXT NOT NULL,
    "middleName" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "nameSuffix" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "poName" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "lastOptOutDate" TIMESTAMP(3),

    CONSTRAINT "Person_pkey" PRIMARY KEY ("externalId")
);

-- CreateTable
CREATE TABLE "MessageSeries" (
    "id" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL,
    "personExternalId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "MessageSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageAttempt" (
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

    CONSTRAINT "MessageAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "topicName" TEXT NOT NULL,
    "stateCode" "StateCode" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'INACTIVE',

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "messageCopyTemplate" TEXT,
    "status" "Status" NOT NULL DEFAULT 'INACTIVE',
    "topicId" TEXT NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "stateCode" "StateCode" NOT NULL,
    "workflowExecutionTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Click" (
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "clickTime" TIMESTAMP(3) NOT NULL,
    "messagingServiceSid" TEXT NOT NULL,
    "accountSid" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "smsSid" TEXT NOT NULL,

    CONSTRAINT "Click_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GroupToPerson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GroupToPerson_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_pseudonymizedId_key" ON "Person"("pseudonymizedId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_personId_key" ON "Person"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_phoneNumber_key" ON "Person"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MessageAttempt_twilioMessageSid_key" ON "MessageAttempt"("twilioMessageSid");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_topicName_stateCode_key" ON "Topic"("topicName", "stateCode");

-- CreateIndex
CREATE UNIQUE INDEX "Group_groupName_topicId_key" ON "Group"("groupName", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "Click_smsSid_key" ON "Click"("smsSid");

-- CreateIndex
CREATE INDEX "_GroupToPerson_B_index" ON "_GroupToPerson"("B");

-- AddForeignKey
ALTER TABLE "MessageSeries" ADD CONSTRAINT "MessageSeries_personExternalId_fkey" FOREIGN KEY ("personExternalId") REFERENCES "Person"("externalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageSeries" ADD CONSTRAINT "MessageSeries_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAttempt" ADD CONSTRAINT "MessageAttempt_messageSeriesId_fkey" FOREIGN KEY ("messageSeriesId") REFERENCES "MessageSeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAttempt" ADD CONSTRAINT "MessageAttempt_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Click" ADD CONSTRAINT "Click_smsSid_fkey" FOREIGN KEY ("smsSid") REFERENCES "MessageAttempt"("twilioMessageSid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToPerson" ADD CONSTRAINT "_GroupToPerson_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToPerson" ADD CONSTRAINT "_GroupToPerson_B_fkey" FOREIGN KEY ("B") REFERENCES "Person"("externalId") ON DELETE CASCADE ON UPDATE CASCADE;

