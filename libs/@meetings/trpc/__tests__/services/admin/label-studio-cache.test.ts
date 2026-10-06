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

import { beforeEach, describe, expect, test, vi } from "vitest";

import type { LabelStudioClient } from "~@meetings/tasks/label-studio-client";
import {
  getLabelStudioSnapshot,
  resetLabelStudioSnapshotCache,
} from "~@meetings/trpc/services/admin/label-studio-cache";

const PROJECT_ID = 1;

const CONFIG_XML = `
<View>
  <Text name="case_note_display" value="$case_note"/>
  <Choices name="case_note_accuracy" toName="case_note_display">
    <Choice value="GOOD"/><Choice value="BAD"/>
  </Choices>
  <TextArea name="case_note_notes" toName="case_note_display" />
  <Text name="action_items_display" value="$action_items"/>
  <Choices name="action_items_accuracy" toName="action_items_display">
    <Choice value="GOOD"/><Choice value="BAD"/>
  </Choices>
  <Text name="overall_display" value="$case_note"/>
  <Choices name="overall_grade" toName="overall_display">
    <Choice value="GOOD"/><Choice value="BAD"/>
  </Choices>
</View>
`;

interface StubTask {
  id: number;
  meetingId: string;
  stateCode: string;
  actionItems?: string | null;
  totalAnnotations: number;
}

interface StubAnnotation {
  taskId: number;
  completedBy: number;
  createdAt: string;
  grades: Record<string, string>;
  notes?: Record<string, string>;
}

function stubClient(tasks: StubTask[], annotations: StubAnnotation[]) {
  const listAnnotationsForTask = vi.fn(async (taskId: number) =>
    annotations
      .filter((a) => a.taskId === taskId)
      .map((a) => ({
        id: a.taskId * 100,
        completed_by: a.completedBy,
        created_at: a.createdAt,
        updated_at: a.createdAt,
        lead_time: null,
        was_cancelled: false,
        ground_truth: false,
        result: [
          ...Object.entries(a.grades).map(([from_name, value]) => ({
            from_name,
            type: "choices",
            value: { choices: [value] },
          })),
          ...Object.entries(a.notes ?? {}).map(([from_name, value]) => ({
            from_name,
            type: "textarea",
            value: { text: [value] },
          })),
        ],
      })),
  );

  const listTasksForProject = vi.fn(async () =>
    tasks.map((t) => ({
      id: t.id,
      total_annotations: t.totalAnnotations,
      data: {
        meeting_id: t.meetingId,
        action_items: t.actionItems ?? null,
        state_code: t.stateCode,
      },
    })),
  );

  const client = {
    getProjectLabelConfig: vi.fn(async () => CONFIG_XML),
    listTasksForProject,
    listUsers: vi.fn(async () => [
      { id: 1, email: "rater@recidiviz.org" },
      { id: 2, email: "admin@recidiviz.org" },
    ]),
    listAnnotationsForTask,
  } as unknown as LabelStudioClient;

  return { client, listAnnotationsForTask, listTasksForProject };
}

describe("getLabelStudioSnapshot", () => {
  beforeEach(() => {
    resetLabelStudioSnapshotCache();
  });

  test("decodes annotations into per-meeting grades", async () => {
    const { client } = stubClient(
      [
        {
          id: 1,
          meetingId: "meeting-1",
          stateCode: "US_NE",
          actionItems: "[Client] Call the office",
          totalAnnotations: 1,
        },
      ],
      [
        {
          taskId: 1,
          completedBy: 1,
          createdAt: "2026-09-10T00:00:00Z",
          grades: {
            case_note_accuracy: "BAD",
            action_items_accuracy: "GOOD",
            overall_grade: "BAD",
          },
          notes: { case_note_notes: "invented a home visit" },
        },
      ],
    );

    const snapshot = await getLabelStudioSnapshot(client, PROJECT_ID);
    const entry = snapshot.byMeetingId.get("meeting-1");

    expect(entry?.collapsed).toMatchObject({
      caseNote: "BAD",
      actionItems: "GOOD",
      overall: "BAD",
    });
    expect(entry?.annotations[0].raterEmail).toBe("rater@recidiviz.org");
    expect(entry?.annotations[0].actionItemsIgnoredFieldName).toBeNull();
  });

  test("never fetches annotations for tasks that report none", async () => {
    // This is what keeps a crawl to a few hundred requests rather than one
    // per task in the project.
    const { client, listAnnotationsForTask } = stubClient(
      [
        {
          id: 1,
          meetingId: "meeting-1",
          stateCode: "US_NE",
          totalAnnotations: 0,
        },
        {
          id: 2,
          meetingId: "meeting-2",
          stateCode: "US_NE",
          totalAnnotations: 1,
        },
      ],
      [
        {
          taskId: 2,
          completedBy: 1,
          createdAt: "2026-09-10T00:00:00Z",
          grades: { case_note_accuracy: "GOOD" },
        },
      ],
    );

    const snapshot = await getLabelStudioSnapshot(client, PROJECT_ID);

    expect(listAnnotationsForTask).toHaveBeenCalledTimes(1);
    expect(listAnnotationsForTask).toHaveBeenCalledWith(2);
    expect(snapshot.taskCount).toBe(2);
    expect(snapshot.annotatedTaskCount).toBe(1);
  });

  test("counts tasks with no usable meeting id or state rather than dropping them silently", async () => {
    // Without this count, a task missing its state would disappear with no trace.
    const { client } = stubClient(
      [
        { id: 1, meetingId: "meeting-1", stateCode: "", totalAnnotations: 1 },
        {
          id: 2,
          meetingId: "meeting-2",
          stateCode: "US_NE",
          totalAnnotations: 1,
        },
      ],
      [
        {
          taskId: 2,
          completedBy: 1,
          createdAt: "2026-09-10T00:00:00Z",
          grades: { case_note_accuracy: "BAD" },
        },
      ],
    );

    const snapshot = await getLabelStudioSnapshot(client, PROJECT_ID);

    expect(snapshot.unusableTaskCount).toBe(1);
    expect(snapshot.byMeetingId.has("meeting-1")).toBe(false);
  });

  test("remembers tasks nobody has rated yet, keeping the newest task per meeting", async () => {
    const { client } = stubClient(
      [
        {
          id: 1,
          meetingId: "meeting-unrated",
          stateCode: "US_NE",
          totalAnnotations: 0,
        },
        {
          id: 2,
          meetingId: "meeting-dupe",
          stateCode: "US_NE",
          totalAnnotations: 0,
        },
        {
          id: 7,
          meetingId: "meeting-dupe",
          stateCode: "US_NE",
          totalAnnotations: 0,
        },
      ],
      [],
    );

    const snapshot = await getLabelStudioSnapshot(client, PROJECT_ID);

    expect(snapshot.byMeetingId.size).toBe(0);
    expect(snapshot.taskIdByMeetingId.get("meeting-unrated")).toBe(1);
    expect(snapshot.taskIdByMeetingId.get("meeting-dupe")).toBe(7);
  });

  test("the authoritative rater's grade wins over another rater's", async () => {
    const { client } = stubClient(
      [
        {
          id: 1,
          meetingId: "meeting-1",
          stateCode: "US_NE",
          actionItems: "x",
          totalAnnotations: 2,
        },
      ],
      [
        {
          taskId: 1,
          completedBy: 1,
          createdAt: "2026-09-10T00:00:00Z",
          grades: { case_note_accuracy: "BAD" },
        },
        {
          taskId: 1,
          completedBy: 2,
          createdAt: "2026-09-11T00:00:00Z",
          grades: { case_note_accuracy: "GOOD" },
        },
      ],
    );

    const snapshot = await getLabelStudioSnapshot(client, PROJECT_ID);

    expect(snapshot.byMeetingId.get("meeting-1")?.collapsed.caseNote).toBe(
      "GOOD",
    );
  });

  test("ignores an action-items grade given while the field was blank, pre-fix", async () => {
    const { client } = stubClient(
      [
        {
          id: 1,
          meetingId: "meeting-1",
          stateCode: "US_NE",
          actionItems: null,
          totalAnnotations: 1,
        },
      ],
      [
        {
          taskId: 1,
          completedBy: 1,
          createdAt: "2026-07-01T00:00:00Z",
          grades: {
            case_note_accuracy: "GOOD",
            action_items_accuracy: "BAD",
            overall_grade: "BAD",
          },
        },
      ],
    );

    const snapshot = await getLabelStudioSnapshot(client, PROJECT_ID);
    const entry = snapshot.byMeetingId.get("meeting-1");

    expect(entry?.collapsed.actionItems).toBeUndefined();
    expect(entry?.collapsed.overall).toBe("GOOD");
    // Still shown on the card, just marked as excluded.
    expect(entry?.annotations[0].actionItemsIgnoredFieldName).toBe(
      "action_items_accuracy",
    );
  });

  test("honours an action-items grade on a blank field after the fix shipped", async () => {
    // Post-fix, blank means the meeting genuinely generated no action items.
    const { client } = stubClient(
      [
        {
          id: 1,
          meetingId: "meeting-1",
          stateCode: "US_NE",
          actionItems: null,
          totalAnnotations: 1,
        },
      ],
      [
        {
          taskId: 1,
          completedBy: 1,
          createdAt: "2026-09-10T00:00:00Z",
          grades: {
            case_note_accuracy: "GOOD",
            action_items_accuracy: "BAD",
            overall_grade: "BAD",
          },
        },
      ],
    );

    const snapshot = await getLabelStudioSnapshot(client, PROJECT_ID);
    const entry = snapshot.byMeetingId.get("meeting-1");

    expect(entry?.collapsed.actionItems).toBe("BAD");
    expect(entry?.collapsed.overall).toBe("BAD");
    expect(entry?.annotations[0].actionItemsIgnoredFieldName).toBeNull();
  });

  describe("caching", () => {
    const tasks: StubTask[] = [
      {
        id: 1,
        meetingId: "meeting-1",
        stateCode: "US_NE",
        totalAnnotations: 1,
      },
    ];
    const annotations: StubAnnotation[] = [
      {
        taskId: 1,
        completedBy: 1,
        createdAt: "2026-09-10T00:00:00Z",
        grades: { case_note_accuracy: "BAD" },
      },
    ];

    test("serves a second call from cache", async () => {
      const { client, listTasksForProject } = stubClient(tasks, annotations);

      await getLabelStudioSnapshot(client, PROJECT_ID);
      await getLabelStudioSnapshot(client, PROJECT_ID);

      expect(listTasksForProject).toHaveBeenCalledTimes(1);
    });

    test("concurrent callers share one crawl", async () => {
      const { client, listTasksForProject } = stubClient(tasks, annotations);

      await Promise.all(
        Array.from({ length: 10 }, () =>
          getLabelStudioSnapshot(client, PROJECT_ID),
        ),
      );

      expect(listTasksForProject).toHaveBeenCalledTimes(1);
    });

    test("re-crawls once the TTL has passed", async () => {
      const { client, listTasksForProject } = stubClient(tasks, annotations);

      const first = await getLabelStudioSnapshot(client, PROJECT_ID);
      await getLabelStudioSnapshot(client, PROJECT_ID, {
        now: first.fetchedAt.getTime() + 16 * 60 * 1000,
      });

      expect(listTasksForProject).toHaveBeenCalledTimes(2);
    });

    test("a failed crawl rejects rather than caching an empty snapshot", async () => {
      // Resolving empty would read as "nobody has reviewed anything", which is
      // indistinguishable from a genuinely unreviewed backlog.
      const { client } = stubClient(tasks, annotations);
      vi.mocked(client.listTasksForProject).mockRejectedValueOnce(
        new Error("IAP rejected the request"),
      );

      await expect(getLabelStudioSnapshot(client, PROJECT_ID)).rejects.toThrow(
        "IAP rejected the request",
      );

      // ...and the next call tries again rather than serving the failure.
      const snapshot = await getLabelStudioSnapshot(client, PROJECT_ID);
      expect(snapshot.byMeetingId.size).toBe(1);
    });

    test("one unreadable task is counted, not fatal", async () => {
      const { client } = stubClient(
        [
          {
            id: 1,
            meetingId: "meeting-1",
            stateCode: "US_NE",
            totalAnnotations: 1,
          },
          {
            id: 2,
            meetingId: "meeting-2",
            stateCode: "US_NE",
            totalAnnotations: 1,
          },
        ],
        [
          {
            taskId: 2,
            completedBy: 1,
            createdAt: "2026-09-10T00:00:00Z",
            grades: { case_note_accuracy: "BAD" },
          },
        ],
      );
      vi.mocked(client.listAnnotationsForTask).mockImplementation(
        async (taskId: number) => {
          if (taskId === 1) throw new Error("boom");
          return [
            {
              id: 200,
              completed_by: 1,
              created_at: "2026-09-10T00:00:00Z",
              updated_at: "2026-09-10T00:00:00Z",
              lead_time: null,
              was_cancelled: false,
              ground_truth: false,
              result: [
                {
                  from_name: "case_note_accuracy",
                  type: "choices",
                  value: { choices: ["BAD"] },
                },
              ],
            },
          ];
        },
      );

      const snapshot = await getLabelStudioSnapshot(client, PROJECT_ID);

      expect(snapshot.perTaskFailures).toBe(1);
      expect(snapshot.byMeetingId.has("meeting-2")).toBe(true);
    });
  });
});
