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
import {
  NotetakingPipelineRun,
  Prisma,
  PrismaClient,
  StateCode,
} from "~@meetings/prisma/client";

const meetingIncludeArgs = {
  include: {
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
  typeof meetingIncludeArgs
>;

/** One row of the dashboard, flattened and ready to render. */
export interface DashboardRow {
  stateCode: StateCode;
  meeting: DashboardMeeting;
  pipelineRun: NotetakingPipelineRun | undefined;
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
      ...meetingIncludeArgs,
    });

    if (meetings.length === 0) {
      return [];
    }

    // NotetakingPipelineRun.meetingId is intentionally not a foreign key, so the
    // runs can't come back on the `include` above.
    const pipelineRuns = await prisma.notetakingPipelineRun.findMany({
      where: { meetingId: { in: meetings.map((m) => m.id) } },
      orderBy: { createdAt: "desc" },
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
      // Prisma connection errors run many lines long; one per state would bury
      // the summary, so only the first line is shown here.
      const message = String(
        result.reason instanceof Error ? result.reason.message : result.reason,
      ).trim();
      console.warn(`  ⚠️  ${stateCode}: skipped — ${message.split("\n")[0]}`);
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
