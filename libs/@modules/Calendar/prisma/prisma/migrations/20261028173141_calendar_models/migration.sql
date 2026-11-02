-- Calendar module tables (Spec D v2), built on the placeholder Calendar table
-- from 20261027041235_initial_dummy_schema. That table has no rows, so the
-- required columns added to it below need no defaults. A database serves one
-- state (CALENDAR__<STATE>), so no table has a stateCode column.
--
-- Rows point at their calendar's types, kinds, resources and months through
-- foreign keys on (calendarId, id). The database itself then refuses a
-- reference to another calendar's row, because seed SQL inserts rows
-- directly and skips the checks that code runs on every write.

-- CreateEnum
CREATE TYPE "public"."CalendarMonthStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "public"."CalendarEntrySource" AS ENUM ('PATTERN', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."CalendarMonthStatusEventType" AS ENUM ('CREATED', 'PUBLISHED', 'UNPUBLISHED');

-- AlterTable
ALTER TABLE "public"."Calendar" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdByEmail" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedByEmail" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."CalendarResourceType" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "CalendarResourceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarResource" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "name" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByEmail" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByEmail" TEXT NOT NULL,

    CONSTRAINT "CalendarResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarEntryKind" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "CalendarEntryKind_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarEntryPattern" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "kindId" TEXT NOT NULL,
    "resourceId" TEXT,
    "slotKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "rules" JSONB NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "CalendarEntryPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarMonth" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "public"."CalendarMonthStatus" NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByEmail" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByEmail" TEXT NOT NULL,

    CONSTRAINT "CalendarMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarEntry" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "monthId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "kindId" TEXT NOT NULL,
    "resourceId" TEXT,
    "slotKey" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "source" "public"."CalendarEntrySource" NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelledByEmail" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByEmail" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByEmail" TEXT NOT NULL,

    CONSTRAINT "CalendarEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarMonthStatusEvent" (
    "id" TEXT NOT NULL,
    "monthId" TEXT NOT NULL,
    "type" "public"."CalendarMonthStatusEventType" NOT NULL,
    "fromStatus" "public"."CalendarMonthStatus",
    "toStatus" "public"."CalendarMonthStatus" NOT NULL,
    "revision" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorEmail" TEXT NOT NULL,

    CONSTRAINT "CalendarMonthStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarResourceType_calendarId_code_key" ON "public"."CalendarResourceType"("calendarId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarResourceType_calendarId_id_key" ON "public"."CalendarResourceType"("calendarId", "id");

-- CreateIndex
CREATE INDEX "CalendarResource_calendarId_isActive_sortOrder_idx" ON "public"."CalendarResource"("calendarId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarResource_calendarId_code_key" ON "public"."CalendarResource"("calendarId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarResource_calendarId_id_key" ON "public"."CalendarResource"("calendarId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEntryKind_calendarId_code_key" ON "public"."CalendarEntryKind"("calendarId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEntryKind_calendarId_id_key" ON "public"."CalendarEntryKind"("calendarId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEntryPattern_calendarId_slotKey_version_key" ON "public"."CalendarEntryPattern"("calendarId", "slotKey", "version");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarMonth_calendarId_year_month_key" ON "public"."CalendarMonth"("calendarId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarMonth_calendarId_id_key" ON "public"."CalendarMonth"("calendarId", "id");

-- CreateIndex
CREATE INDEX "CalendarEntry_resourceId_date_idx" ON "public"."CalendarEntry"("resourceId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEntry_monthId_date_slotKey_key" ON "public"."CalendarEntry"("monthId", "date", "slotKey");

-- CreateIndex
CREATE INDEX "CalendarMonthStatusEvent_monthId_createdAt_idx" ON "public"."CalendarMonthStatusEvent"("monthId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Calendar_code_key" ON "public"."Calendar"("code");

-- AddForeignKey
ALTER TABLE "public"."CalendarResourceType" ADD CONSTRAINT "CalendarResourceType_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "public"."Calendar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarResource" ADD CONSTRAINT "CalendarResource_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "public"."Calendar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarResource" ADD CONSTRAINT "CalendarResource_calendarId_typeId_fkey" FOREIGN KEY ("calendarId", "typeId") REFERENCES "public"."CalendarResourceType"("calendarId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEntryKind" ADD CONSTRAINT "CalendarEntryKind_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "public"."Calendar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEntryPattern" ADD CONSTRAINT "CalendarEntryPattern_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "public"."Calendar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEntryPattern" ADD CONSTRAINT "CalendarEntryPattern_calendarId_kindId_fkey" FOREIGN KEY ("calendarId", "kindId") REFERENCES "public"."CalendarEntryKind"("calendarId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEntryPattern" ADD CONSTRAINT "CalendarEntryPattern_calendarId_resourceId_fkey" FOREIGN KEY ("calendarId", "resourceId") REFERENCES "public"."CalendarResource"("calendarId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarMonth" ADD CONSTRAINT "CalendarMonth_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "public"."Calendar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEntry" ADD CONSTRAINT "CalendarEntry_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "public"."Calendar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEntry" ADD CONSTRAINT "CalendarEntry_calendarId_monthId_fkey" FOREIGN KEY ("calendarId", "monthId") REFERENCES "public"."CalendarMonth"("calendarId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEntry" ADD CONSTRAINT "CalendarEntry_calendarId_kindId_fkey" FOREIGN KEY ("calendarId", "kindId") REFERENCES "public"."CalendarEntryKind"("calendarId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEntry" ADD CONSTRAINT "CalendarEntry_calendarId_resourceId_fkey" FOREIGN KEY ("calendarId", "resourceId") REFERENCES "public"."CalendarResource"("calendarId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarMonthStatusEvent" ADD CONSTRAINT "CalendarMonthStatusEvent_monthId_fkey" FOREIGN KEY ("monthId") REFERENCES "public"."CalendarMonth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CHECK constraints, added by hand. Prisma can't model CHECK constraints and
-- leaves these in place on later migrations. They cover only rules that don't
-- depend on entry-type behaviour, which is each state's code (D36); code
-- checks the rest on every write.

-- CalendarEntry
ALTER TABLE "CalendarEntry" ADD CONSTRAINT "CalendarEntry_cancel_fields_together"
  CHECK (("cancelledAt" IS NULL) = ("cancelledByEmail" IS NULL));
ALTER TABLE "CalendarEntry" ADD CONSTRAINT "CalendarEntry_time_format"
  CHECK (("startTime" IS NULL OR "startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
     AND ("endTime" IS NULL OR "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'));
ALTER TABLE "CalendarEntry" ADD CONSTRAINT "CalendarEntry_endTime_after_startTime"
  CHECK ("endTime" IS NULL OR ("startTime" IS NOT NULL AND "endTime" > "startTime"));
ALTER TABLE "CalendarEntry" ADD CONSTRAINT "CalendarEntry_slotKey_matches_resource"
  CHECK ((strpos("slotKey", ':') > 0) = ("resourceId" IS NOT NULL));

-- CalendarEntryPattern
ALTER TABLE "CalendarEntryPattern" ADD CONSTRAINT "CalendarEntryPattern_time_format"
  CHECK (("startTime" IS NULL OR "startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
     AND ("endTime" IS NULL OR "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'));
ALTER TABLE "CalendarEntryPattern" ADD CONSTRAINT "CalendarEntryPattern_endTime_after_startTime"
  CHECK ("endTime" IS NULL OR ("startTime" IS NOT NULL AND "endTime" > "startTime"));
ALTER TABLE "CalendarEntryPattern" ADD CONSTRAINT "CalendarEntryPattern_slotKey_matches_resource"
  CHECK ((strpos("slotKey", ':') > 0) = ("resourceId" IS NOT NULL));
ALTER TABLE "CalendarEntryPattern" ADD CONSTRAINT "CalendarEntryPattern_rules_nonempty_array"
  CHECK (jsonb_typeof("rules") = 'array' AND jsonb_array_length("rules") > 0);

-- CalendarMonth
ALTER TABLE "CalendarMonth" ADD CONSTRAINT "CalendarMonth_month_range"
  CHECK ("month" BETWEEN 1 AND 12);
