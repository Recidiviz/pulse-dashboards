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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  ApprovalValue,
  NoteSection,
  NotetakingPipelineStatus,
  OutputVoteTab,
  OutputVoteValue,
  Prisma,
  StateCode,
  TranscriptionProvider,
} from "~@meetings/prisma/client";
import { IMPERSONATED_EMAIL_HEADER_KEY } from "~@meetings/trpc/context";
import * as flaggedMeetingsUtils from "~@meetings/trpc/routes/admin/flagged-meetings/utils";
import type {
  LabelStudioSnapshot,
  LabelStudioTaskAnnotations,
} from "~@meetings/trpc/services/admin/label-studio-cache";
import * as labelStudioCache from "~@meetings/trpc/services/admin/label-studio-cache";
import * as labelStudioConfigModule from "~@meetings/trpc/services/admin/label-studio-config";
import {
  initFastifyAndSetUser,
  testPrismaClient,
  testTRPCClient,
} from "~@meetings/trpc/test/setup";
import { fakeStaff } from "~@meetings/trpc/test/setup/seed";

const STATE = StateCode.US_NE;
const STAFF_EMAIL = "staff-email-1@example.com";

/** A stable "now" so the default window and the meeting dates line up. */
const NOW = new Date("2026-09-30T12:00:00Z");
const IN_WINDOW = new Date("2026-09-15T12:00:00Z");

type Grade = "GOOD" | "PARTIAL" | "BAD";

function textScore(grade: Grade) {
  return {
    grade,
    rationale: `graded ${grade}`,
    hallucinations: [],
    omissions: [],
  };
}

function scores(grades: {
  caseNote?: Grade;
  actionItems?: Grade;
  overall?: Grade;
  transcriptBad?: boolean;
}) {
  return {
    caseNote: grades.caseNote ? textScore(grades.caseNote) : null,
    actionItems: grades.actionItems ? textScore(grades.actionItems) : null,
    overall: grades.overall ? textScore(grades.overall) : null,
    transcriptComparison: grades.transcriptBad
      ? {
          rationale: "deepgram dropped the second half",
          winner: "ASSEMBLYAI",
          assemblyAiGrade: "BAD",
          deepgramGrade: "BAD",
        }
      : null,
  };
}

async function createMeeting(
  id: string,
  overrides: Partial<Prisma.MeetingUncheckedCreateInput> = {},
) {
  return testPrismaClient.meeting.create({
    data: {
      id,
      staffEmail: STAFF_EMAIL,
      startTime: IN_WINDOW,
      recordingsGCSBucket: "test-bucket",
      recordingsFolderPath: id,
      caseNote: "a draft case note",
      ...overrides,
    },
  });
}

/** Attach an LLMAJ evaluation to a meeting, via its pipeline run. */
async function evaluate(
  meetingId: string,
  grades: Parameters<typeof scores>[0],
  {
    pipelineRunId = `${meetingId}-run`,
    createdAt = new Date("2026-09-16T00:00:00Z"),
  }: { pipelineRunId?: string; createdAt?: Date } = {},
) {
  await testPrismaClient.notetakingPipelineRun.create({
    data: {
      id: pipelineRunId,
      meetingId,
      personPseudonymizedId: "person-pid-1",
      status: NotetakingPipelineStatus.SUCCESS,
    },
  });
  await testPrismaClient.notetakingEvaluationRun.create({
    data: {
      pipelineRunId,
      evaluatorVersion: "v1",
      scores: scores(grades) as unknown as Prisma.InputJsonValue,
      createdAt,
    },
  });
  return pipelineRunId;
}

async function vote(
  meetingId: string,
  pipelineRunId: string,
  value: OutputVoteValue,
  overrides: Partial<Prisma.OutputVoteUncheckedCreateInput> = {},
) {
  return testPrismaClient.outputVote.create({
    data: {
      meetingId,
      pipelineRunId,
      voterEmail: STAFF_EMAIL,
      vote: value,
      tab: OutputVoteTab.DRAFT_CASE_NOTES,
      createdAt: new Date("2026-09-16T00:00:00Z"),
      ...overrides,
    },
  });
}

function list(
  input: Parameters<
    typeof testTRPCClient.v1.flaggedMeetings.list.query
  >[0] = {},
) {
  return testTRPCClient.v1.flaggedMeetings.list.query(input);
}

function details(meetingId: string, stateCode: StateCode = STATE) {
  return testTRPCClient.v1.flaggedMeetings.getDetails.query({
    stateCode,
    meetingId,
  });
}

async function setRecidivizUser(allowedStates: string[] = [STATE]) {
  await initFastifyAndSetUser(
    {
      "https://dashboard.recidiviz.org/email_address": "test@recidiviz.org",
      "https://dashboard.recidiviz.org/app_metadata": {
        stateCode: "recidiviz",
        allowedStates,
      },
    },
    { stateCode: STATE },
  );
}

async function setStaffUser() {
  await initFastifyAndSetUser(
    {
      "https://dashboard.recidiviz.org/email_address": STAFF_EMAIL,
      "https://dashboard.recidiviz.org/app_metadata": { stateCode: STATE },
    },
    { stateCode: STATE },
  );
}

function labelStudioAnnotation(
  overrides: Partial<LabelStudioTaskAnnotations["annotations"][number]> = {},
): LabelStudioTaskAnnotations["annotations"][number] {
  return {
    raterEmail: "rater@recidiviz.org",
    annotatedAt: new Date("2026-09-17T00:00:00Z"),
    updatedAt: new Date("2026-09-17T00:00:00Z"),
    decodedFields: [
      {
        fromName: "case_note_accuracy",
        toName: "case_note_display",
        value: "BAD",
      },
      {
        fromName: "case_note_notes",
        toName: "case_note_display",
        value: "Invented a UA refusal.",
      },
    ],
    grades: { caseNote: "BAD" },
    actionItemsIgnoredFieldName: null,
    ...overrides,
  };
}

function labelStudioEntry(
  meetingId: string,
  overrides: Partial<LabelStudioTaskAnnotations> = {},
): LabelStudioTaskAnnotations {
  return {
    taskId: 501,
    meetingId,
    stateCode: STATE,
    annotations: [labelStudioAnnotation()],
    collapsed: { caseNote: "BAD" },
    hasUncoveredBadGrade: false,
    latestAnnotationAt: new Date("2026-09-17T00:00:00Z"),
    ...overrides,
  };
}

function useLabelStudio(
  entries: LabelStudioTaskAnnotations[],
  unratedTasks: { meetingId: string; taskId: number }[] = [],
) {
  vi.mocked(labelStudioConfigModule.labelStudioConfig).mockReturnValue({
    client: {} as never,
    baseUrl: "https://label-studio.example.com/",
    projectId: 7,
  });
  const snapshot: LabelStudioSnapshot = {
    fetchedAt: NOW,
    byMeetingId: new Map(entries.map((e) => [e.meetingId, e])),
    taskIdByMeetingId: new Map([
      ...entries.map((e): [string, number] => [e.meetingId, e.taskId]),
      ...unratedTasks.map((t): [string, number] => [t.meetingId, t.taskId]),
    ]),
    taskCount: entries.length + unratedTasks.length,
    annotatedTaskCount: entries.length,
    perTaskFailures: 0,
    unusableTaskCount: 0,
  };
  vi.mocked(labelStudioCache.getLabelStudioSnapshot).mockResolvedValue(
    snapshot,
  );
}

describe("flaggedMeetings router", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"], now: NOW });
    vi.spyOn(labelStudioConfigModule, "labelStudioConfig").mockReturnValue(
      null,
    );
    vi.spyOn(labelStudioCache, "getLabelStudioSnapshot").mockReset();
    vi.spyOn(flaggedMeetingsUtils, "findBadEvaluationMeetingIds");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("authorization", () => {
    test("throws FORBIDDEN for list when called by a non-Recidiviz user", async () => {
      await setStaffUser();

      await expect(list()).rejects.toMatchObject({
        data: { code: "FORBIDDEN" },
      });
    });

    test("throws FORBIDDEN for getDetails when called by a non-Recidiviz user", async () => {
      await setStaffUser();

      await expect(details("meeting-1")).rejects.toMatchObject({
        data: { code: "FORBIDDEN" },
      });
    });

    test("throws FORBIDDEN when list asks for a state outside allowedStates", async () => {
      await setRecidivizUser([STATE]);

      await expect(
        list({ stateCodes: [StateCode.US_ND] }),
      ).rejects.toMatchObject({ data: { code: "FORBIDDEN" } });
    });

    test("throws FORBIDDEN when getDetails asks for a state outside allowedStates", async () => {
      // The client picks which state's database getDetails reads, so this is
      // the one place an unchecked stateCode would be a read into another
      // state's PII.
      await setRecidivizUser([STATE]);

      await expect(details("meeting-1", StateCode.US_ND)).rejects.toMatchObject(
        { data: { code: "FORBIDDEN" } },
      );
    });

    test("reads only the caller's allowed states when none are named", async () => {
      await setRecidivizUser([STATE]);
      await createMeeting("meeting-allowed");
      await evaluate("meeting-allowed", { caseNote: "BAD" });

      const { meetings } = await list();

      expect(meetings.map((m) => m.stateCode)).toEqual([STATE]);
    });

    describe("while impersonating", () => {
      beforeEach(async () => {
        await initFastifyAndSetUser(
          {
            "https://dashboard.recidiviz.org/email_address":
              "test@recidiviz.org",
            "https://dashboard.recidiviz.org/app_metadata": {
              stateCode: "recidiviz",
              allowedStates: [STATE],
            },
          },
          {
            extraHeaders: {
              [IMPERSONATED_EMAIL_HEADER_KEY]: fakeStaff[0].email,
            },
          },
        );
      });

      test("rejects list and getDetails", async () => {
        const message = "Admin requests are not allowed while impersonating";

        await expect(list()).rejects.toThrow(message);
        await expect(details("meeting-1")).rejects.toThrow(message);
      });
    });
  });

  describe("flagging", () => {
    beforeEach(async () => {
      await setRecidivizUser();
    });

    test("flags a meeting whose case note graded BAD", async () => {
      await createMeeting("meeting-bad-case-note");
      await evaluate("meeting-bad-case-note", {
        caseNote: "BAD",
        actionItems: "GOOD",
        overall: "BAD",
      });

      const { meetings } = await list();

      expect(meetings).toHaveLength(1);
      expect(meetings[0]).toMatchObject({
        meetingId: "meeting-bad-case-note",
        stateCode: STATE,
        llm: {
          grades: { caseNote: "BAD", actionItems: "GOOD", overall: "BAD" },
        },
        sections: {
          CASE_NOTE: { llm: true, labelStudio: false, vote: false },
          ACTION_ITEMS: { llm: false, labelStudio: false, vote: false },
          // The BAD overall sits on top of a BAD case note, so it adds no
          // separate thing to review.
          OVERALL: { llm: false, labelStudio: false, vote: false },
        },
      });
    });

    test("a BAD overall on its own flags Overall", async () => {
      await createMeeting("meeting-overall-only");
      await evaluate("meeting-overall-only", {
        caseNote: "GOOD",
        actionItems: "GOOD",
        overall: "BAD",
      });

      const { meetings } = await list();

      expect(meetings[0]).toMatchObject({
        meetingId: "meeting-overall-only",
        sections: { OVERALL: { llm: true } },
      });
    });

    test("does not flag a meeting graded GOOD throughout", async () => {
      await createMeeting("meeting-good");
      await evaluate("meeting-good", {
        caseNote: "GOOD",
        actionItems: "GOOD",
        overall: "GOOD",
      });

      expect((await list()).meetings).toEqual([]);
    });

    test("a BAD transcript comparison never flags on its own", async () => {
      await createMeeting("meeting-bad-transcript");
      await evaluate("meeting-bad-transcript", {
        caseNote: "GOOD",
        actionItems: "GOOD",
        overall: "GOOD",
        transcriptBad: true,
      });

      expect((await list()).meetings).toEqual([]);
    });

    test.each([
      [OutputVoteTab.DRAFT_CASE_NOTES, "CASE_NOTE"],
      [OutputVoteTab.ACTION_ITEMS, "ACTION_ITEMS"],
    ] as const)("a thumbs-down on %s flags %s", async (tab, section) => {
      await createMeeting("meeting-thumbs-down", {
        outputsPipelineRunId: "run-thumbs",
      });
      await vote("meeting-thumbs-down", "run-thumbs", OutputVoteValue.DOWN, {
        tab,
      });

      const { meetings } = await list();

      expect(meetings).toHaveLength(1);
      expect(meetings[0]).toMatchObject({
        meetingId: "meeting-thumbs-down",
        llm: null,
        votes: [{ tab, vote: OutputVoteValue.DOWN }],
      });
      expect(meetings[0].sections[section].vote).toBe(true);
    });

    test("a thumbs-down on Staff Feedback does not flag a meeting", async () => {
      // Staff Feedback is coaching for the staff member, not a rating of the notes.
      await createMeeting("meeting-feedback-down", {
        outputsPipelineRunId: "run-feedback",
      });
      await vote(
        "meeting-feedback-down",
        "run-feedback",
        OutputVoteValue.DOWN,
        {
          tab: OutputVoteTab.STAFF_FEEDBACK,
        },
      );

      expect((await list()).meetings).toEqual([]);
    });

    test("a thumbs-up does not flag a meeting", async () => {
      await createMeeting("meeting-thumbs-up", {
        outputsPipelineRunId: "run-up",
      });
      await vote("meeting-thumbs-up", "run-up", OutputVoteValue.UP);

      expect((await list()).meetings).toEqual([]);
    });

    test("ignores a thumbs-down cast against a superseded pipeline run", async () => {
      // The meeting was reprocessed after the vote, so the content that vote
      // was about no longer exists.
      await createMeeting("meeting-stale-vote", {
        outputsPipelineRunId: "run-current",
      });
      await vote("meeting-stale-vote", "run-superseded", OutputVoteValue.DOWN);

      expect((await list()).meetings).toEqual([]);
    });

    test("keeps only the latest vote per voter and tab", async () => {
      await createMeeting("meeting-flipped-vote", {
        outputsPipelineRunId: "run-flip",
      });
      await vote("meeting-flipped-vote", "run-flip", OutputVoteValue.DOWN, {
        createdAt: new Date("2026-09-16T00:00:00Z"),
      });
      await vote("meeting-flipped-vote", "run-flip", OutputVoteValue.UP, {
        createdAt: new Date("2026-09-17T00:00:00Z"),
      });

      // The thumbs-down was flipped to a thumbs-up, so nothing is flagged.
      expect((await list()).meetings).toEqual([]);
    });

    test("uses the most recent evaluation when a meeting was reprocessed", async () => {
      await createMeeting("meeting-reprocessed");
      await evaluate(
        "meeting-reprocessed",
        { caseNote: "BAD", overall: "BAD" },
        {
          pipelineRunId: "run-old",
          createdAt: new Date("2026-09-16T00:00:00Z"),
        },
      );
      await evaluate(
        "meeting-reprocessed",
        { caseNote: "GOOD", actionItems: "GOOD", overall: "GOOD" },
        {
          pipelineRunId: "run-new",
          createdAt: new Date("2026-09-17T00:00:00Z"),
        },
      );

      expect((await list()).meetings).toEqual([]);
    });

    test("sorts by meeting date, newest first", async () => {
      await createMeeting("meeting-older", {
        startTime: new Date("2026-09-10T12:00:00Z"),
      });
      await evaluate("meeting-older", { caseNote: "BAD" });
      await createMeeting("meeting-newer", {
        startTime: new Date("2026-09-20T12:00:00Z"),
      });
      await evaluate("meeting-newer", { caseNote: "BAD" });

      expect((await list()).meetings.map((m) => m.meetingId)).toEqual([
        "meeting-newer",
        "meeting-older",
      ]);
    });
  });

  describe("filtering", () => {
    beforeEach(async () => {
      await setRecidivizUser();
    });

    test("excludes meetings outside the lookback window", async () => {
      await createMeeting("meeting-outside", {
        startTime: new Date("2026-08-01T12:00:00Z"),
      });
      await evaluate("meeting-outside", { caseNote: "BAD" });

      expect((await list({ lookbackDays: 30 })).meetings).toEqual([]);
      expect(
        (await list({ lookbackDays: 90 })).meetings.map((m) => m.meetingId),
      ).toEqual(["meeting-outside"]);
    });

    test("defaults to the maximum lookback", async () => {
      await createMeeting("meeting-months-ago", {
        startTime: new Date("2026-01-15T12:00:00Z"),
      });
      await evaluate("meeting-months-ago", { caseNote: "BAD" });

      expect((await list()).meetings).toHaveLength(1);
    });

    test("rejects a lookback beyond the maximum", async () => {
      await expect(list({ lookbackDays: 366 })).rejects.toThrow();
    });

    test("search matches the meeting id or staff email, ignoring case", async () => {
      await createMeeting("meeting-alex", { staffEmail: "alex@example.com" });
      await evaluate("meeting-alex", { caseNote: "BAD" });
      await createMeeting("meeting-sam", { staffEmail: "sam@example.com" });
      await evaluate("meeting-sam", { caseNote: "BAD" });

      expect(
        (await list({ search: "ALEX@" })).meetings.map((m) => m.meetingId),
      ).toEqual(["meeting-alex"]);
      expect(
        (await list({ search: "meeting-SAM" })).meetings.map(
          (m) => m.meetingId,
        ),
      ).toEqual(["meeting-sam"]);
    });

    test("search does not match the case note", async () => {
      await createMeeting("meeting-housing", {
        caseNote: "Discussed the housing voucher application",
      });
      await evaluate("meeting-housing", { caseNote: "BAD" });

      expect((await list({ search: "housing voucher" })).meetings).toEqual([]);
    });
  });

  describe("list payload", () => {
    beforeEach(async () => {
      await setRecidivizUser();
    });

    test("carries no free text, only grades and flags", async () => {
      await createMeeting("meeting-payload", {
        outputsPipelineRunId: "run-msg",
      });
      await evaluate("meeting-payload", { caseNote: "BAD" });
      await vote("meeting-payload", "run-msg", OutputVoteValue.DOWN, {
        message: "the note invented a home visit",
      });

      const [meeting] = (await list()).meetings;

      expect(meeting).not.toHaveProperty("caseNote");
      expect(meeting.llm).not.toHaveProperty("dimensions");
      expect(meeting.votes[0]).not.toHaveProperty("message");
      expect(JSON.stringify(meeting)).not.toContain("invented a home visit");
    });
  });

  describe("sources", () => {
    beforeEach(async () => {
      await setRecidivizUser();
    });

    test("reports every source ok, and Label Studio unconfigured, where there is none", async () => {
      const { sources } = await list();

      expect(sources).toEqual([
        { name: "database", status: "ok" },
        { name: "evaluations", status: "ok" },
        { name: "labelStudio", status: "not_configured" },
        { name: "inAppFeedback", status: "ok" },
      ]);
    });

    test("hides the list when a source fails, and says which", async () => {
      await createMeeting("meeting-hidden");
      await vote("meeting-hidden", "run-x", OutputVoteValue.DOWN);
      await testPrismaClient.meeting.update({
        where: { id: "meeting-hidden" },
        data: { outputsPipelineRunId: "run-x" },
      });
      vi.mocked(
        flaggedMeetingsUtils.findBadEvaluationMeetingIds,
      ).mockRejectedValueOnce(
        new Error("connection reset with the query text in it"),
      );

      const result = await list();

      // The thumbs-down would have flagged the meeting, but a list built
      // without the evaluations could be missing others.
      expect(result.meetings).toEqual([]);
      expect(result.sources.find((s) => s.name === "evaluations")).toEqual({
        name: "evaluations",
        status: "failed",
        error: "Error",
      });
      expect(result.sources.filter((s) => s.status === "failed")).toHaveLength(
        1,
      );
    });
  });

  describe("with Label Studio configured", () => {
    beforeEach(async () => {
      await setRecidivizUser();
    });

    test("flags a meeting only Label Studio rated BAD", async () => {
      await createMeeting("meeting-ls-bad");
      useLabelStudio([labelStudioEntry("meeting-ls-bad")]);

      const { meetings, sources } = await list();

      expect(sources.find((s) => s.name === "labelStudio")).toEqual({
        name: "labelStudio",
        status: "ok",
      });
      expect(meetings).toHaveLength(1);
      expect(meetings[0]).toMatchObject({
        meetingId: "meeting-ls-bad",
        llm: null,
        labelStudio: {
          status: "rated",
          taskId: 501,
          raterCount: 1,
          combined: { caseNote: "BAD" },
        },
        sections: { CASE_NOTE: { llm: false, labelStudio: true, vote: false } },
      });
    });

    test("distinguishes a task nobody rated from a meeting never sent", async () => {
      await createMeeting("meeting-unrated");
      await evaluate("meeting-unrated", { caseNote: "BAD" });
      await createMeeting("meeting-unsent");
      await evaluate("meeting-unsent", { caseNote: "BAD" });
      useLabelStudio([], [{ meetingId: "meeting-unrated", taskId: 77 }]);

      const byId = Object.fromEntries(
        (await list()).meetings.map((m) => [m.meetingId, m.labelStudio]),
      );

      expect(byId["meeting-unrated"]).toEqual({
        status: "not_rated",
        taskId: 77,
      });
      expect(byId["meeting-unsent"]).toEqual({ status: "not_sent" });
    });

    test("does not flag on a BAD an authoritative rater overrode away", async () => {
      await createMeeting("meeting-overridden");
      useLabelStudio([
        labelStudioEntry("meeting-overridden", {
          collapsed: { caseNote: "PARTIAL" },
        }),
      ]);

      expect((await list()).meetings).toEqual([]);
    });

    test("ignores a rated meeting outside the requested states", async () => {
      await createMeeting("meeting-elsewhere");
      useLabelStudio([
        labelStudioEntry("meeting-elsewhere", { stateCode: StateCode.US_ND }),
      ]);

      expect((await list()).meetings).toEqual([]);
    });

    test("hides the list and names Label Studio when the crawl fails", async () => {
      await createMeeting("meeting-ls-down");
      await evaluate("meeting-ls-down", { caseNote: "BAD" });
      useLabelStudio([]);
      vi.mocked(labelStudioCache.getLabelStudioSnapshot).mockRejectedValue(
        new Error("IAP returned 401"),
      );

      const result = await list();

      expect(result.meetings).toEqual([]);
      expect(result.sources.find((s) => s.name === "labelStudio")).toEqual({
        name: "labelStudio",
        status: "failed",
        error: "Error",
      });
    });
  });

  describe("getDetails", () => {
    beforeEach(async () => {
      await setRecidivizUser();
    });

    test("returns the full judge output and vote messages", async () => {
      await createMeeting("meeting-detail", {
        outputsPipelineRunId: "run-detail",
      });
      await evaluate(
        "meeting-detail",
        { caseNote: "BAD" },
        { pipelineRunId: "run-detail" },
      );
      await vote("meeting-detail", "run-detail", OutputVoteValue.DOWN, {
        message: "invented a home visit",
      });

      const result = await details("meeting-detail");

      expect(result.caseNote.current).toBe("a draft case note");
      expect(result.llm?.evaluatorVersion).toBe("v1");
      expect(result.llm?.dimensions[0].rationale).toBe("graded BAD");
      expect(result.votes[0].message).toBe("invented a home visit");
      expect(result.sections.CASE_NOTE).toEqual({
        llm: true,
        labelStudio: false,
        vote: true,
      });
    });

    test("includes every Label Studio rater, the combined grade and a task link", async () => {
      await createMeeting("meeting-ls-detail");
      useLabelStudio([
        labelStudioEntry("meeting-ls-detail", {
          taskId: 812,
          annotations: [
            labelStudioAnnotation({ raterEmail: "maya@recidiviz.org" }),
            labelStudioAnnotation({
              raterEmail: "admin@recidiviz.org",
              grades: { caseNote: "PARTIAL" },
            }),
          ],
          collapsed: { caseNote: "PARTIAL" },
        }),
      ]);

      const result = await details("meeting-ls-detail");

      expect(result.labelStudio).toMatchObject({
        taskId: 812,
        taskUrl: "https://label-studio.example.com/projects/7/data?task=812",
        combined: {
          caseNote: {
            grade: "PARTIAL",
            worst: "BAD",
            overriddenByAuthoritative: true,
          },
        },
      });
      expect(
        result.labelStudio?.raters.map((r) => [
          r.raterEmail,
          r.isAuthoritative,
        ]),
      ).toEqual([
        ["maya@recidiviz.org", false],
        ["admin@recidiviz.org", true],
      ]);
      expect(result.labelStudio?.raters[0].fields).toHaveLength(2);
    });

    test("reports a Label Studio task nobody has rated yet", async () => {
      await createMeeting("meeting-ls-unrated");
      useLabelStudio([], [{ meetingId: "meeting-ls-unrated", taskId: 9 }]);

      const result = await details("meeting-ls-unrated");

      expect(result.labelStudio).toMatchObject({ taskId: 9, raters: [] });
    });

    test("reports no Label Studio task for a meeting that was never sent", async () => {
      await createMeeting("meeting-ls-none");
      useLabelStudio([]);

      expect((await details("meeting-ls-none")).labelStudio).toBeNull();
    });

    test("reports approval per section on the current pipeline run only", async () => {
      await createMeeting("meeting-approvals", {
        notetakingPipelineRunId: "run-current",
      });
      const approve = (
        section: NoteSection,
        value: ApprovalValue,
        pipelineRunId: string,
        createdAt: string,
      ) =>
        testPrismaClient.noteApproval.create({
          data: {
            meetingId: "meeting-approvals",
            approverEmail: STAFF_EMAIL,
            section,
            value,
            pipelineRunId,
            createdAt: new Date(createdAt),
          },
        });
      await approve(
        NoteSection.CASE_NOTE,
        ApprovalValue.APPROVED,
        "run-current",
        "2026-09-16T10:00:00Z",
      );
      // Approved, then unapproved: not approved.
      await approve(
        NoteSection.ACTION_ITEMS,
        ApprovalValue.APPROVED,
        "run-current",
        "2026-09-16T10:00:00Z",
      );
      await approve(
        NoteSection.ACTION_ITEMS,
        ApprovalValue.UNAPPROVED,
        "run-current",
        "2026-09-16T11:00:00Z",
      );
      // Approved against notes that have since been regenerated: ignored.
      await approve(
        NoteSection.CASE_NOTE,
        ApprovalValue.APPROVED,
        "run-old",
        "2026-09-17T10:00:00Z",
      );

      const result = await details("meeting-approvals");

      expect(result.caseNote.approvedAt).toEqual(
        new Date("2026-09-16T10:00:00Z"),
      );
      expect(result.actionItems.approvedAt).toBeNull();
    });

    test("returns the best transcript as timestamped utterances", async () => {
      await createMeeting("meeting-transcript");
      const utterance = (text: string, startTimeMs: number) => ({
        text,
        speaker: "Speaker A",
        startTimeMs,
        endTimeMs: startTimeMs + 1000,
        confidence: 0.9,
      });
      await testPrismaClient.transcription.create({
        data: {
          provider: TranscriptionProvider.ASSEMBLYAI,
          transcriptObject: {} as PrismaJson.TranscriptType,
          confidence: 0.95,
          meetingId: "meeting-transcript",
          utterances: {
            create: [utterance("second", 5000), utterance("first", 1000)],
          },
        },
      });
      await testPrismaClient.transcription.create({
        data: {
          provider: TranscriptionProvider.DEEPGRAM,
          transcriptObject: {} as PrismaJson.TranscriptType,
          confidence: 0.5,
          meetingId: "meeting-transcript",
          utterances: { create: [utterance("worse", 0)] },
        },
      });

      expect((await details("meeting-transcript")).transcript).toEqual([
        { speaker: "Speaker A", text: "first", startTimeMs: 1000 },
        { speaker: "Speaker A", text: "second", startTimeMs: 5000 },
      ]);
    });

    test("returns no transcript once it has been deleted", async () => {
      await createMeeting("meeting-transcript-deleted", {
        transcriptDeletedAt: new Date("2026-09-20T00:00:00Z"),
      });

      const result = await details("meeting-transcript-deleted");

      expect(result.transcript).toBeNull();
      expect(result.transcriptDeletedAt).toEqual(
        new Date("2026-09-20T00:00:00Z"),
      );
    });

    test("returns action items with staff edits, deletions and additions", async () => {
      await createMeeting("meeting-action-items", {
        notetakingPipelineRunId: "run-ai",
      });
      await testPrismaClient.meetingActionItem.create({
        data: {
          meetingId: "meeting-action-items",
          assignee: "CLIENT",
          generatedTask: "Call the provider",
          editedTask: "Officer: call the provider",
          completed: false,
          deleted: true,
          pipelineRunId: "run-ai",
        },
      });
      await testPrismaClient.meetingActionItem.create({
        data: {
          meetingId: "meeting-action-items",
          assignee: "OFFICER",
          generatedTask: "Added by the officer",
          completed: false,
          deleted: false,
          pipelineRunId: null,
        },
      });

      const { actionItems } = await details("meeting-action-items");

      expect(actionItems.items).toEqual([
        {
          assignee: "CLIENT",
          generatedTask: "Call the provider",
          editedTask: "Officer: call the provider",
          context: null,
          completed: false,
          deleted: true,
          addedByStaff: false,
        },
        {
          assignee: "OFFICER",
          generatedTask: "Added by the officer",
          editedTask: null,
          context: null,
          completed: false,
          deleted: false,
          addedByStaff: true,
        },
      ]);
    });

    test("links to the GCS console rather than a playable URL", async () => {
      await createMeeting("meeting-audio", {
        finalRecordingGCSPath: "US_NE/meeting-audio/final.m4a",
      });

      const result = await details("meeting-audio");

      expect(result.audioConsoleUrl).toContain("console.cloud.google.com");
    });

    test("reports no audio link once the recording is deleted", async () => {
      await createMeeting("meeting-audio-deleted", {
        finalRecordingGCSPath: "US_NE/meeting-audio-deleted/final.m4a",
        audioDeletedAt: new Date("2026-09-20T00:00:00Z"),
      });

      expect(
        (await details("meeting-audio-deleted")).audioConsoleUrl,
      ).toBeNull();
    });

    test("throws NOT_FOUND for a meeting that does not exist", async () => {
      await expect(details("no-such-meeting")).rejects.toMatchObject({
        data: { code: "NOT_FOUND" },
      });
    });
  });
});
