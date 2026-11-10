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

import {
  APPLICATION_STAGE,
  APPLICATION_SUB_STAGE,
  computeReleaseTaskProgress,
  formatReleaseTaskProgress,
  formatSubStageText,
  ORDERED_RELEASE_TASK_TYPES,
} from "~@idaho-th/shared";

describe("computeReleaseTaskProgress", () => {
  it("returns null for non-RELEASE stages", () => {
    expect(
      computeReleaseTaskProgress(APPLICATION_STAGE.APPLICATION, 3),
    ).toBeNull();
    expect(
      computeReleaseTaskProgress(APPLICATION_STAGE.APPROVALS, 3),
    ).toBeNull();
    expect(computeReleaseTaskProgress(APPLICATION_STAGE.CLOSED, 3)).toBeNull();
  });

  it("defaults completedCount to 0 when the count is undefined", () => {
    expect(
      computeReleaseTaskProgress(APPLICATION_STAGE.RELEASE, undefined),
    ).toEqual({
      completedCount: 0,
      totalCount: ORDERED_RELEASE_TASK_TYPES.length,
    });
  });

  it("uses totalCount from ORDERED_RELEASE_TASK_TYPES", () => {
    expect(computeReleaseTaskProgress(APPLICATION_STAGE.RELEASE, 2)).toEqual({
      completedCount: 2,
      totalCount: ORDERED_RELEASE_TASK_TYPES.length,
    });
  });
});

describe("formatReleaseTaskProgress", () => {
  it("formats plural task progress", () => {
    expect(
      formatReleaseTaskProgress({ completedCount: 1, totalCount: 5 }),
    ).toBe("1 of 5 Tasks Complete");
  });

  it("formats singular task progress", () => {
    expect(
      formatReleaseTaskProgress({ completedCount: 1, totalCount: 1 }),
    ).toBe("1 of 1 Task Complete");
  });
});

describe("formatSubStageText", () => {
  it("prefers release task progress when provided", () => {
    expect(
      formatSubStageText(APPLICATION_SUB_STAGE.PROVIDER_REVIEW, {
        completedCount: 2,
        totalCount: 5,
      }),
    ).toBe("2 of 5 Tasks Complete");
  });

  it("maps a known sub-stage to its label when there is no progress", () => {
    expect(
      formatSubStageText(APPLICATION_SUB_STAGE.PROVIDER_REVIEW, null),
    ).toBe("Provider Review");
  });

  it("falls back to the raw value for an unmapped sub-stage", () => {
    expect(formatSubStageText("UNKNOWN_STAGE", null)).toBe("UNKNOWN_STAGE");
  });
});
