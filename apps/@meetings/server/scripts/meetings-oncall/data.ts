// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

/**
 * Reads recent meetings for the oncall dashboard.
 *
 * Meetings live in one database per state code, so every query fans out across
 * each configured state and the results are merged afterwards.
 */

import { PrismaPg } from "@prisma/adapter-pg";

import { MEETINGS_STATE_CODES } from "~@meetings/config";
import { Prisma, PrismaClient, StateCode } from "~@meetings/prisma/client";

// The dashboard runs from a local checkout, whose schema is often ahead of the
// databases it reads until the next deploy runs the migrations. Selecting only
// the columns it shows, rather than every column, keeps a newly added column
// from failing the query in every state.
const meetingSelectArgs = {
  select: {
    id: true,
    startTime: true,
    endTime: true,
    staffEmail: true,
    meetingType: true,
    meetingTypeCategory: true,
    postMeetingProcessingStatus: true,
    notetakingPipelineRunId: true,
    clientId: true,
    residentId: true,
    recordingsGCSBucket: true,
    finalRecordingGCSPath: true,
    audioDeletedAt: true,
    transcriptDeletedAt: true,
    client: { select: { pseudonymizedId: true } },
    resident: { select: { pseudonymizedId: true } },
    transcriptions: {
      select: {
        provider: true,
        confidence: true,
        transcriptObject: true,
      },
    },
  },
} satisfies Prisma.MeetingDefaultArgs;

export type DashboardMeeting = Prisma.MeetingGetPayload<
  typeof meetingSelectArgs
>;

const pipelineRunSelectArgs = {
  select: {
    id: true,
    meetingId: true,
    status: true,
    langsmithTraceId: true,
    errorDetails: true,
  },
} satisfies Prisma.NotetakingPipelineRunDefaultArgs;

export type DashboardPipelineRun = Prisma.NotetakingPipelineRunGetPayload<
  typeof pipelineRunSelectArgs
>;

/** One row of the dashboard, flattened and ready to render. */
export interface DashboardRow {
  stateCode: StateCode;
  meeting: DashboardMeeting;
  pipelineRun: DashboardPipelineRun | undefined;
}

export interface FetchFilters {
  limit: number;
  meetingId?: string;
  user?: string;
}

export interface FetchResult {
  rows: DashboardRow[];
  /** States whose database could not be reached, surfaced in the UI. */
  skippedStates: string[];
}

function buildWhereClause(filters: FetchFilters): Prisma.MeetingWhereInput {
  const where: Prisma.MeetingWhereInput = {};
  if (filters.meetingId) {
    where.id = filters.meetingId;
  }
  if (filters.user) {
    where.staffEmail = { equals: filters.user, mode: "insensitive" };
  }
  return where;
}

function buildPrismaClient(
  stateCode: StateCode,
  dbUrlTemplate: string,
): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: dbUrlTemplate.replace(
        "{state}",
        stateCode.toLowerCase(),
      ),
    }),
  });
}

async function fetchRowsForStateCode(
  stateCode: StateCode,
  dbUrlTemplate: string,
  filters: FetchFilters,
): Promise<DashboardRow[]> {
  const prisma = buildPrismaClient(stateCode, dbUrlTemplate);

  try {
    const meetings = await prisma.meeting.findMany({
      where: buildWhereClause(filters),
      // Each state is capped at the overall limit; the merge below re-sorts and
      // trims, so this only bounds how much each state can contribute.
      take: filters.limit,
      orderBy: { startTime: "desc" },
      ...meetingSelectArgs,
    });

    if (meetings.length === 0) {
      return [];
    }

    // NotetakingPipelineRun.meetingId is intentionally not a foreign key, so the
    // runs can't come back on the `include` above.
    const pipelineRuns = await prisma.notetakingPipelineRun.findMany({
      where: { meetingId: { in: meetings.map((m) => m.id) } },
      orderBy: { createdAt: "desc" },
      ...pipelineRunSelectArgs,
    });

    return meetings.map((meeting) => ({
      stateCode,
      meeting,
      pipelineRun:
        pipelineRuns.find(
          (run) => run.id === meeting.notetakingPipelineRunId,
        ) ??
        // Fall back to the newest run for this meeting when the meeting doesn't
        // point at one (older meetings, or a run that never completed).
        pipelineRuns.find((run) => run.meetingId === meeting.id),
    }));
  } finally {
    await prisma.$disconnect();
  }
}

export async function fetchRows(
  dbUrlTemplate: string,
  filters: FetchFilters,
): Promise<FetchResult> {
  const allRows: DashboardRow[] = [];
  const skippedStates: string[] = [];

  const settled = await Promise.allSettled(
    MEETINGS_STATE_CODES.map((stateCode) =>
      fetchRowsForStateCode(stateCode as StateCode, dbUrlTemplate, filters),
    ),
  );

  settled.forEach((result, index) => {
    const stateCode = MEETINGS_STATE_CODES[index];
    if (result.status === "fulfilled") {
      console.log(`  ${stateCode}: ${result.value.length} meeting(s)`);
      allRows.push(...result.value);
    } else {
      // Prisma errors run many lines long; one per state would bury the
      // summary, so only one line is shown here. Query errors open with an
      // "Invalid invocation" header and a code frame and end with the cause,
      // so the last non-empty line is the one that says what went wrong.
      const message = String(
        result.reason instanceof Error ? result.reason.message : result.reason,
      ).trim();
      const cause = message
        .split("\n")
        .filter((line) => line.trim())
        .at(-1);
      console.warn(`  ⚠️  ${stateCode}: skipped — ${cause?.trim()}`);
      skippedStates.push(stateCode);
    }
  });

  const rows = allRows
    .sort(
      (a, b) => b.meeting.startTime.getTime() - a.meeting.startTime.getTime(),
    )
    .slice(0, filters.limit);

  return { rows, skippedStates };
}

/** Looks up a single meeting's bucket and folder, for the upload endpoint. */
export async function fetchMeetingStorageLocation(
  dbUrlTemplate: string,
  stateCode: StateCode,
  meetingId: string,
): Promise<
  | { bucket: string; folderPath: string; finalRecordingGCSPath: string | null }
  | undefined
> {
  const prisma = buildPrismaClient(stateCode, dbUrlTemplate);
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: {
        recordingsGCSBucket: true,
        recordingsFolderPath: true,
        finalRecordingGCSPath: true,
      },
    });
    return meeting
      ? {
          bucket: meeting.recordingsGCSBucket,
          folderPath: meeting.recordingsFolderPath,
          finalRecordingGCSPath: meeting.finalRecordingGCSPath,
        }
      : undefined;
  } finally {
    await prisma.$disconnect();
  }
}
