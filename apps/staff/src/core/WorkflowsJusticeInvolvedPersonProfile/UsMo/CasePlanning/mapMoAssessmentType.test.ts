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

import { mapMoAssessmentType } from "./mapMoAssessmentType";

describe("mapMoAssessmentType", () => {
  test.each([
    ["ORAS_COMMUNITY_SUPERVISION", "ORAS_CST"],
    ["ORAS_COMMUNITY_SUPERVISION_SCREENING", "Other"],
    ["ORAS_PRISON_INTAKE", "ORAS_PIT"],
    ["ORAS_PRISON_SCREENING", "Other"],
    ["ORAS_REENTRY", "ORAS_RT"],
    ["ORAS_SUPPLEMENTAL_REENTRY", "ORAS_SRT"],
  ])("maps %s to %s", (input, expected) => {
    expect(mapMoAssessmentType(input)).toBe(expected);
  });

  test("returns null for an unknown assessment type string", () => {
    expect(mapMoAssessmentType("ORAS_SOMETHING_ELSE")).toBeNull();
  });

  test("returns null for an empty string", () => {
    expect(mapMoAssessmentType("")).toBeNull();
  });

  test("returns null for null", () => {
    expect(mapMoAssessmentType(null)).toBeNull();
  });

  test("returns null for undefined", () => {
    expect(mapMoAssessmentType(undefined)).toBeNull();
  });
});
