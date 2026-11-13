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

import type { DocumentSystem } from "~@typesense/client";

import { sourceSystem } from "../emulator/helpers";

const PERSON_SYSTEMS = new Map<string, Set<DocumentSystem>>([
  ["us_tn_client", new Set(["SUPERVISION"])],
  ["us_tn_resident", new Set(["INCARCERATION"])],
  ["us_tn_both", new Set(["SUPERVISION", "INCARCERATION"])],
]);

describe("sourceSystem", () => {
  test("a person in both collections does not decide the system", () => {
    expect(sourceSystem(["us_tn_client", "us_tn_both"], PERSON_SYSTEMS)).toBe(
      "SUPERVISION",
    );
    expect(sourceSystem(["us_tn_both", "us_tn_resident"], PERSON_SYSTEMS)).toBe(
      "INCARCERATION",
    );
  });

  test("is undefined when only dual-system people are in the source", () => {
    expect(sourceSystem(["us_tn_both"], PERSON_SYSTEMS)).toBeUndefined();
  });

  test("is undefined when single-system people disagree", () => {
    expect(
      sourceSystem(["us_tn_client", "us_tn_resident"], PERSON_SYSTEMS),
    ).toBeUndefined();
  });

  test("is undefined when no person document exists", () => {
    expect(sourceSystem(["us_tn_missing"], PERSON_SYSTEMS)).toBeUndefined();
  });
});
