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
import * as labelStudioCache from "~@meetings/trpc/services/admin/label-studio-cache";
import { overrideLabelStudioGrade } from "~@meetings/trpc/services/admin/label-studio-override";

const LABEL_CONFIG = `
<View>
  <Text name="case_note_display" value="$case_note"/>
  <Choices name="case_note_accuracy" toName="case_note_display">
    <Choice value="Accurate" alias="GOOD"/>
    <Choice value="Partially accurate" alias="PARTIAL"/>
    <Choice value="Inaccurate" alias="BAD"/>
  </Choices>
</View>`;

const ADMIN_ID = 9;

function annotation(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    completed_by: ADMIN_ID,
    result: [
      {
        from_name: "case_note_accuracy",
        to_name: "case_note_display",
        type: "choices",
        value: { choices: ["BAD"] },
      },
    ],
    created_at: "2026-09-17T00:00:00Z",
    updated_at: "2026-09-17T00:00:00Z",
    lead_time: null,
    was_cancelled: false,
    ground_truth: false,
    ...overrides,
  };
}

function fakeClient({
  email = "admin@recidiviz.org",
  annotations = [] as ReturnType<typeof annotation>[],
} = {}) {
  const client = {
    getCurrentUser: vi.fn().mockResolvedValue({ id: ADMIN_ID, email }),
    getProjectLabelConfig: vi.fn().mockResolvedValue(LABEL_CONFIG),
    listAnnotationsForTask: vi.fn().mockResolvedValue(annotations),
    updateAnnotation: vi.fn().mockResolvedValue({}),
    createAnnotation: vi.fn().mockResolvedValue({}),
  };
  return client;
}

const run = (client: ReturnType<typeof fakeClient>) =>
  overrideLabelStudioGrade({
    client: client as unknown as LabelStudioClient,
    projectId: 7,
    taskId: 501,
    dimension: "caseNote",
    grade: "GOOD",
  });

describe("overrideLabelStudioGrade", () => {
  beforeEach(() => {
    vi.spyOn(labelStudioCache, "invalidateLabelStudioSnapshot");
  });

  test("updates the authoritative rater's existing annotation", async () => {
    const client = fakeClient({
      annotations: [annotation(), annotation({ id: 2, completed_by: 4 })],
    });

    await run(client);

    expect(client.updateAnnotation).toHaveBeenCalledWith(1, {
      result: [
        expect.objectContaining({
          from_name: "case_note_accuracy",
          value: { choices: ["GOOD"] },
        }),
      ],
    });
    expect(client.createAnnotation).not.toHaveBeenCalled();
    expect(labelStudioCache.invalidateLabelStudioSnapshot).toHaveBeenCalled();
  });

  test("edits the latest annotation when the rater has several", async () => {
    const client = fakeClient({
      annotations: [
        annotation({ id: 1, updated_at: "2026-09-17T00:00:00Z" }),
        annotation({ id: 3, updated_at: "2026-09-20T00:00:00Z" }),
      ],
    });

    await run(client);

    expect(client.updateAnnotation).toHaveBeenCalledWith(3, expect.anything());
  });

  test("creates an annotation when the authoritative rater has none", async () => {
    const client = fakeClient({
      annotations: [annotation({ completed_by: 4 })],
    });

    await run(client);

    expect(client.createAnnotation).toHaveBeenCalledWith(501, {
      result: [
        expect.objectContaining({
          from_name: "case_note_accuracy",
          to_name: "case_note_display",
          value: { choices: ["GOOD"] },
        }),
      ],
    });
    expect(client.updateAnnotation).not.toHaveBeenCalled();
  });

  test("refuses to write when the token is not the authoritative rater's", async () => {
    const client = fakeClient({ email: "someone-else@recidiviz.org" });

    await expect(run(client)).rejects.toThrow(/not the authoritative rater/);

    expect(client.createAnnotation).not.toHaveBeenCalled();
    expect(client.updateAnnotation).not.toHaveBeenCalled();
  });

  test("drops the cached snapshot even when the write fails", async () => {
    const client = fakeClient({ annotations: [annotation()] });
    client.updateAnnotation.mockRejectedValue(new Error("LS 500"));

    await expect(run(client)).rejects.toThrow("LS 500");

    expect(labelStudioCache.invalidateLabelStudioSnapshot).toHaveBeenCalled();
  });
});
