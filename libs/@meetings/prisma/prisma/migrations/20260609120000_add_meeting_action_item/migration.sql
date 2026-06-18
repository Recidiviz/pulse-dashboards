-- CreateTable
CREATE TABLE "public"."MeetingActionItem" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "assignee" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN NOT NULL,
    "editedTask" TEXT,
    "generatedTask" TEXT NOT NULL,
    "evidenceQuotes" TEXT[],
    "deleted" BOOLEAN NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "pipelineRunId" TEXT NOT NULL,

    CONSTRAINT "MeetingActionItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
