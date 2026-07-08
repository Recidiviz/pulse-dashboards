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

import { describe, expect, test } from "vitest";

import {
  getMoAssessmentDisplayName,
  getMoAssessmentMaxScore,
  mapMoAssessmentType,
} from "./mapMoAssessmentType";

describe("mapMoAssessmentType", () => {
  test.each([
    ["ORAS_COMMUNITY_SUPERVISION", "ORAS_CST"],
    ["ORAS_PRISON_INTAKE", "ORAS_PIT"],
    ["ORAS_REENTRY", "ORAS_RT"],
    ["ORAS_SUPPLEMENTAL_REENTRY", "ORAS_SRT"],
  ])("maps %s to %s", (input, expected) => {
    expect(mapMoAssessmentType(input)).toBe(expected);
  });

  test.each([
    // The screening tools have no SAR key; they're handled MO-side.
    "ORAS_COMMUNITY_SUPERVISION_SCREENING",
    "ORAS_PRISON_SCREENING",
    "ORAS_SOMETHING_ELSE",
    "",
  ])("returns null for %s", (input) => {
    expect(mapMoAssessmentType(input)).toBeNull();
  });

  test("returns null for null", () => {
    expect(mapMoAssessmentType(null)).toBeNull();
  });

  test("returns null for undefined", () => {
    expect(mapMoAssessmentType(undefined)).toBeNull();
  });
});

describe("getMoAssessmentDisplayName", () => {
  test.each([
    ["ORAS_COMMUNITY_SUPERVISION", "Community Supervision Tool (ORAS-CST)"],
    ["ORAS_PRISON_INTAKE", "Prison Intake Tool (ORAS-PIT)"],
    ["ORAS_REENTRY", "Reentry Tool (ORAS-RT)"],
    ["ORAS_SUPPLEMENTAL_REENTRY", "Supplemental Reentry Tool (ORAS-SRT)"],
    [
      "ORAS_COMMUNITY_SUPERVISION_SCREENING",
      "Community Supervision Screening Tool (ORAS-CSST)",
    ],
    ["ORAS_PRISON_SCREENING", "Prison Screening Tool (ORAS-PST)"],
  ])("maps %s to its real display name", (input, expected) => {
    expect(getMoAssessmentDisplayName(input)).toBe(expected);
  });

  test.each(["ORAS_SOMETHING_ELSE", "", null, undefined])(
    "falls back to 'Other Assessment' for %s",
    (input) => {
      expect(getMoAssessmentDisplayName(input)).toBe("Other Assessment");
    },
  );
});

describe("getMoAssessmentMaxScore", () => {
  test.each([
    ["ORAS_COMMUNITY_SUPERVISION", 49],
    ["ORAS_PRISON_INTAKE", 40],
    ["ORAS_REENTRY", 28],
    ["ORAS_SUPPLEMENTAL_REENTRY", 45],
  ])("returns the configured max for %s", (input, expected) => {
    expect(getMoAssessmentMaxScore(input)).toBe(expected);
  });

  test.each([
    // Deferred (CSST/PST) and unrecognized types have no configured max.
    "ORAS_COMMUNITY_SUPERVISION_SCREENING",
    "ORAS_PRISON_SCREENING",
    "ORAS_SOMETHING_ELSE",
    "",
  ])("returns undefined for %s", (input) => {
    expect(getMoAssessmentMaxScore(input)).toBeUndefined();
  });
});
