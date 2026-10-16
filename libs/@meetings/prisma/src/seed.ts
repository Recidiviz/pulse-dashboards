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

/* eslint-disable no-await-in-loop */

import { Transcript } from "assemblyai";

import {
  NotetakingPipelineStatus,
  OutputVoteTab,
  OutputVoteValue,
  PostMeetingProcessingStatus,
  Prisma,
  PrismaClient,
  StateCode,
} from "~@meetings/prisma/client";
import {
  CLIENT_CNI_SUMMARIES,
  DEMO_PEOPLE,
  DemoPerson,
  displaySpeaker,
  parseTranscript,
} from "~@meetings/prisma/demo-data";

// Single demo staff member who "owns" all seeded meetings. Client/resident
// lists default to the "all" caseload (no email filter), so these meetings are
// visible to any demo user regardless of this address.
const STAFF_ID = 1n;
const STAFF_EMAIL = "demo.officer@recidiviz.org";

const UTTERANCE_CONFIDENCE = 0.96;
const TRANSCRIPTION_CONFIDENCE = 0.96;

/** Pull the "SUMMARY:" blurb out of a case note for the transcript summary. */
function caseNoteSummary(caseNote: string): string {
  const match = caseNote.match(/SUMMARY:\s*([\s\S]*?)(?:\n\n|$)/);
  return (match ? match[1] : caseNote.split("\n\n")[0]).trim();
}

/** Spread utterance timestamps evenly across the meeting duration. */
function buildUtterances(person: DemoPerson, durationMs: number) {
  const parsed = parseTranscript(person);
  const slice = parsed.length > 0 ? Math.floor(durationMs / parsed.length) : 0;
  return parsed.map((u, i) => ({
    confidence: UTTERANCE_CONFIDENCE,
    startTimeMs: i * slice,
    endTimeMs: (i + 1) * slice,
    speaker: displaySpeaker(person, u.speaker),
    text: u.text,
  }));
}

/**
 * Upsert a single demo meeting and its transcript without touching any
 * user-created meetings. Clears only this meeting's own transcription/utterance
 * children before recreating them so re-seeding stays idempotent.
 */
async function seedMeeting(
  prisma: PrismaClient,
  person: DemoPerson,
  meetingId: string,
  personLink: { clientId: bigint } | { residentId: bigint },
  order: number,
) {
  const durationMs = person.durationMinutes * 60 * 1000;
  // Space meetings ~1.5 days apart, most recent first.
  const endTime = new Date(Date.now() - order * 36 * 60 * 60 * 1000);
  const startTime = new Date(endTime.getTime() - durationMs);
  const utterances = buildUtterances(person, durationMs);

  const existing = await prisma.transcription.findMany({
    where: { meetingId },
    select: { id: true },
  });
  if (existing.length > 0) {
    await prisma.utterance.deleteMany({
      where: { transcriptionId: { in: existing.map((t) => t.id) } },
    });
    await prisma.transcription.deleteMany({ where: { meetingId } });
  }
  await prisma.meetingActionItem.deleteMany({ where: { meetingId } });

  const data = {
    startTime,
    endTime,
    durationMs,
    ...personLink,
    staffEmail: STAFF_EMAIL,
    meetingType: person.meetingType,
    recordingsGCSBucket: "demo-audio-bucket",
    recordingsFolderPath: `${StateCode.US_DEMO}/${meetingId}`,
    userNotepadNotes: "",
    caseNote: person.caseNote,
    meetingActionItems: {
      create: person.actionItems.map((item) => ({
        assignee: item.assignee,
        generatedTask: item.task,
        context: item.context ?? null,
        evidenceQuotes: item.evidenceQuotes ?? [],
        completed: false,
        deleted: false,
        pipelineRunId: `pipeline-${meetingId}`,
      })),
    },
    staffFeedback: person.staffFeedback,
    staffFeedbackGeneratedAt: new Date(),
    outputsPipelineRunId: `pipeline-${meetingId}`,
    postMeetingProcessingStatus: PostMeetingProcessingStatus.COMPLETED,
    transcriptions: {
      create: [
        {
          provider: "ASSEMBLYAI" as const,
          transcriptObject: {} as Transcript,
          confidence: TRANSCRIPTION_CONFIDENCE,
          summary: caseNoteSummary(person.caseNote),
          utterances: { create: utterances },
        },
      ],
    },
  } satisfies Prisma.MeetingUncheckedUpdateInput &
    Prisma.MeetingUncheckedCreateInput;

  await prisma.meeting.upsert({
    where: { id: meetingId },
    create: { id: meetingId, ...data },
    update: data,
  });
}

type Grade = "GOOD" | "PARTIAL" | "BAD";

function textScore(
  grade: Grade,
  rationale: string,
  hallucinations: string[] = [],
) {
  return { grade, rationale, hallucinations, omissions: [] };
}

const GOOD_SCORE = textScore("GOOD", "Accurate and complete.");

/**
 * LLM judge grades and thumbs-down votes that put demo meetings on the admin
 * Flagged meetings page, one per review scenario: a BAD case note, an Overall
 * BAD with nothing else flagged, a thumbs down with no BAD grade, and BAD
 * action items. Ids are fixed so re-seeding replaces these rows only.
 */
const FLAGGED_MEETINGS: {
  meetingId: string;
  scores: {
    caseNote: ReturnType<typeof textScore>;
    actionItems: ReturnType<typeof textScore>;
    overall: ReturnType<typeof textScore>;
  };
  thumbsDown?: { tab: OutputVoteTab; message: string };
}[] = [
  {
    meetingId: "meeting-1",
    scores: {
      caseNote: textScore(
        "BAD",
        "The note says the client missed her housing office appointment, but she says she went.",
        ["Client missed her appointment at the housing office."],
      ),
      actionItems: GOOD_SCORE,
      overall: textScore("PARTIAL", "The case note misstates attendance."),
    },
  },
  {
    meetingId: "meeting-2",
    scores: {
      caseNote: GOOD_SCORE,
      actionItems: GOOD_SCORE,
      overall: textScore(
        "BAD",
        "Taken together, the outputs understate a safety concern raised in the meeting.",
      ),
    },
  },
  {
    meetingId: "meeting-3",
    scores: {
      caseNote: GOOD_SCORE,
      actionItems: GOOD_SCORE,
      overall: GOOD_SCORE,
    },
    thumbsDown: {
      tab: OutputVoteTab.DRAFT_CASE_NOTES,
      message: "The employment section has the wrong start date.",
    },
  },
  {
    meetingId: "meeting-4",
    scores: {
      caseNote: GOOD_SCORE,
      actionItems: textScore(
        "BAD",
        "An action item assigns the client a curfew check-in that was never discussed.",
        ["Client to check in by phone every night at 9pm."],
      ),
      overall: textScore("PARTIAL", "One invented action item."),
    },
  },
];

async function seedFlaggedMeetings(prisma: PrismaClient) {
  for (const { meetingId, scores, thumbsDown } of FLAGGED_MEETINGS) {
    // Matches the outputsPipelineRunId seedMeeting sets, so votes count as current.
    const pipelineRunId = `pipeline-${meetingId}`;
    await prisma.notetakingPipelineRun.upsert({
      where: { id: pipelineRunId },
      create: {
        id: pipelineRunId,
        meetingId,
        personPseudonymizedId: "demo-person-pid",
        status: NotetakingPipelineStatus.SUCCESS,
      },
      update: {},
    });
    const evaluation = {
      pipelineRunId,
      evaluatorVersion: "demo",
      scores: { transcriptComparison: null, ...scores },
    };
    await prisma.notetakingEvaluationRun.upsert({
      where: { id: `seed-eval-${meetingId}` },
      create: { id: `seed-eval-${meetingId}`, ...evaluation },
      update: evaluation,
    });
    if (thumbsDown) {
      const vote = {
        meetingId,
        pipelineRunId,
        voterEmail: STAFF_EMAIL,
        vote: OutputVoteValue.DOWN,
        ...thumbsDown,
      };
      await prisma.outputVote.upsert({
        where: { id: `seed-vote-${meetingId}` },
        create: { id: `seed-vote-${meetingId}`, ...vote },
        update: vote,
      });
    }
  }
}

export async function main(prisma: PrismaClient) {
  const importedAt = new Date();

  // Upsert the single demo staff member. NOTE: we deliberately do not wipe the
  // database — re-seeding upserts the known demo records by stable id and
  // leaves user-created demo meetings intact (OBT-25443).
  await prisma.staff.upsert({
    where: { staffId: STAFF_ID },
    create: {
      staffId: STAFF_ID,
      stableStaffExternalId: "staff-ext-1",
      pseudonymizedId: "staff-pid-1",
      givenNames: "Demo",
      surname: "Officer",
      email: STAFF_EMAIL,
      stateCode: StateCode.US_DEMO,
    },
    update: {
      givenNames: "Demo",
      surname: "Officer",
      email: STAFF_EMAIL,
      stateCode: StateCode.US_DEMO,
    },
  });

  let clientIndex = 0;
  let residentIndex = 0;
  let order = 0;

  for (const person of DEMO_PEOPLE) {
    if (person.type === "client") {
      const idx = ++clientIndex;
      const personId = BigInt(idx);
      await prisma.client.upsert({
        where: { personId },
        create: {
          stateCode: StateCode.US_DEMO,
          personId,
          stablePersonExternalId: `client-ext-${idx}`,
          stablePersonExternalIdType: "client-ext-type-1",
          displayPersonExternalId: `client-display-ext-${idx}`,
          pseudonymizedId: `client-pid-${idx}`,
          givenNames: person.givenNames,
          surname: person.surname,
          supervisionType: "PAROLE",
          staffEmails: [STAFF_EMAIL],
          isActive: true,
          lastImportedAt: importedAt,
        },
        update: {
          givenNames: person.givenNames,
          surname: person.surname,
          staffEmails: [STAFF_EMAIL],
          isActive: true,
          lastImportedAt: importedAt,
        },
      });
      await seedMeeting(
        prisma,
        person,
        `meeting-${idx}`,
        { clientId: personId },
        order++,
      );
      if (clientIndex <= CLIENT_CNI_SUMMARIES.length) {
        for (const summary of CLIENT_CNI_SUMMARIES[clientIndex - 1]) {
          await prisma.caseNoteInsightsSummary.upsert({
            where: { id: `cni-id-${summary.category}-${clientIndex}` },
            create: {
              stateCode: StateCode.US_DEMO,
              clientId: personId,
              id: `cni-id-${summary.category}-${clientIndex}`,
              category: summary.category,
              cniFields: summary.fields,
              lastImportedAt: importedAt,
            },
            update: {
              category: summary.category,
              cniFields: summary.fields,
              lastImportedAt: importedAt,
            },
          });
        }
      }
    } else {
      const idx = ++residentIndex;
      const personId = BigInt(idx);
      await prisma.resident.upsert({
        where: { personId },
        create: {
          stateCode: StateCode.US_DEMO,
          personId,
          stablePersonExternalId: `resident-ext-${idx}`,
          stablePersonExternalIdType: "resident-ext-type-1",
          displayPersonExternalId: `resident-display-ext-${idx}`,
          pseudonymizedId: `resident-pid-${idx}`,
          givenNames: person.givenNames,
          surname: person.surname,
          facilityId: `facility-${idx}`,
          isActive: true,
          lastImportedAt: importedAt,
        },
        update: {
          givenNames: person.givenNames,
          surname: person.surname,
          facilityId: `facility-${idx}`,
          isActive: true,
          lastImportedAt: importedAt,
        },
      });
      await seedMeeting(
        prisma,
        person,
        `resident-meeting-${idx}`,
        { residentId: personId },
        order++,
      );
    }
  }

  await seedFlaggedMeetings(prisma);
}
