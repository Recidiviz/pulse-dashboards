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

import { describe, expect, it } from "vitest";

import { RELEASE_TASK_NOTE_MAX_LENGTH } from "~@idaho-th/shared";

import {
  toggleReleaseTaskSchema,
  updateReleaseTaskDetailSchema,
} from "../homePlan.schema";

// The schema is a union; every case here exercises its text member.
const parseTextDetail = (input: unknown) => {
  const result = updateReleaseTaskDetailSchema.parse(input);
  if (result.type !== "text") throw new Error("expected a text detail");
  return result;
};

describe("updateReleaseTaskDetailSchema", () => {
  it("trims surrounding whitespace", () => {
    const result = parseTextDetail({
      applicationId: "app-1",
      taskType: "TRANSPORTATION_SECURED",
      type: "text",
      note: "  Bus  ",
    });

    expect(result.note).toBe("Bus");
  });

  it("converts an empty (or whitespace-only) note to null", () => {
    expect(
      parseTextDetail({
        applicationId: "app-1",
        taskType: "TRANSPORTATION_SECURED",
        type: "text",
        note: "",
      }).note,
    ).toBeNull();

    expect(
      parseTextDetail({
        applicationId: "app-1",
        taskType: "TRANSPORTATION_SECURED",
        type: "text",
        note: "   ",
      }).note,
    ).toBeNull();
  });

  it("accepts an explicit null note", () => {
    expect(
      parseTextDetail({
        applicationId: "app-1",
        taskType: "TRANSPORTATION_SECURED",
        type: "text",
        note: null,
      }).note,
    ).toBeNull();
  });

  it("rejects a note longer than the max length", () => {
    expect(() =>
      parseTextDetail({
        applicationId: "app-1",
        taskType: "TRANSPORTATION_SECURED",
        type: "text",
        note: "a".repeat(RELEASE_TASK_NOTE_MAX_LENGTH + 1),
      }),
    ).toThrow();
  });

  it("accepts a note exactly at the max length", () => {
    const note = "a".repeat(RELEASE_TASK_NOTE_MAX_LENGTH);
    expect(
      parseTextDetail({
        applicationId: "app-1",
        taskType: "TRANSPORTATION_SECURED",
        type: "text",
        note,
      }).note,
    ).toBe(note);
  });

  it("accepts the RESIDENT_CONFIRMED_FUNDING task type", () => {
    const result = parseTextDetail({
      applicationId: "app-1",
      taskType: "RESIDENT_CONFIRMED_FUNDING",
      type: "text",
      note: "Self-pay",
    });

    expect(result.taskType).toBe("RESIDENT_CONFIRMED_FUNDING");
    expect(result.note).toBe("Self-pay");
  });

  it("accepts the TRANSPORTATION_INSTRUCTIONS task type", () => {
    const result = parseTextDetail({
      applicationId: "app-1",
      taskType: "TRANSPORTATION_INSTRUCTIONS",
      type: "text",
      note: "Meet at XYZ bus station at 1pm on 10/28",
    });

    expect(result.taskType).toBe("TRANSPORTATION_INSTRUCTIONS");
    expect(result.note).toBe("Meet at XYZ bus station at 1pm on 10/28");
  });

  it("rejects a note on a non-note-enabled task", () => {
    expect(() =>
      parseTextDetail({
        applicationId: "app-1",
        taskType: "FUNDING_SECURED",
        type: "text",
        note: "Should fail",
      }),
    ).toThrow();
  });
});

describe("toggleReleaseTaskSchema", () => {
  it("accepts an active release task type", () => {
    expect(() =>
      toggleReleaseTaskSchema.parse({
        applicationId: "app-1",
        taskType: "FUNDING_SECURED",
        completed: true,
      }),
    ).not.toThrow();
  });

  it("rejects a retired task type no longer in the active list", () => {
    expect(() =>
      toggleReleaseTaskSchema.parse({
        applicationId: "app-1",
        taskType: "HOUSING_APPLICATION_SIGNED",
        completed: true,
      }),
    ).toThrow();
  });
});
