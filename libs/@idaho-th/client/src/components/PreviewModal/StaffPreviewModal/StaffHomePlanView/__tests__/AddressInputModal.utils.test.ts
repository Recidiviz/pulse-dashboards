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

import { computeGhostSuffix } from "../AddressInputModal.utils";

describe("computeGhostSuffix", () => {
  it("returns empty when nothing is typed or typed tokens exceed prediction", () => {
    expect(computeGhostSuffix("", "123 Main St, Boise, ID")).toBe("");
    expect(computeGhostSuffix("1 2 3 4 5 6", "1 2 3")).toBe("");
  });

  it("completes a mid-word token using the prediction spelling", () => {
    expect(computeGhostSuffix("123 Mai", "123 Main St")).toBe("n St");
    expect(computeGhostSuffix("Hope", "Hope Housing")).toBe(" Housing");
  });

  it("folds US address abbreviations so Street matches St", () => {
    expect(computeGhostSuffix("123 Main Street", "123 Main St Boise ID")).toBe(
      " Boise ID",
    );
    expect(computeGhostSuffix("123 Main St", "123 Main Street Boise")).toBe(
      "reet Boise",
    );
  });

  it("returns empty when earlier tokens diverge", () => {
    expect(computeGhostSuffix("999 Main", "123 Main St")).toBe("");
  });

  it("strips periods/commas but keeps hyphens in the prefix match", () => {
    // Trailing period is stripped before abbreviation folding, so "St." matches "Street".
    expect(computeGhostSuffix("123 Main St.", "123 Main Street Boise")).toBe(
      " Boise",
    );
    expect(computeGhostSuffix("Boise,", "Boise ID")).toBe(" ID");
    expect(computeGhostSuffix("Wilkes", "Wilkes-Barre PA")).toBe("-Barre PA");
  });
});
