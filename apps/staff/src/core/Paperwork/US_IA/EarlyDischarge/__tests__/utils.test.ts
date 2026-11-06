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

import { chargeMetaLine, jurisdictionSlug } from "../utils";

describe("chargeMetaLine", () => {
  it("joins jurisdiction, cause number and count without a county suffix", () => {
    expect(
      chargeMetaLine({
        jurisdiction: "BLACK HAWK",
        causeNumber: "FECR002891",
        counts: 2,
      }),
    ).toBe("BLACK HAWK · FECR002891 · Count 2");
  });
});

describe("jurisdictionSlug", () => {
  it("removes every space from a jurisdiction", () => {
    expect(jurisdictionSlug("BLACK HAWK")).toBe("BLACKHAWK");
    expect(jurisdictionSlug("DISTRICT OF COLUMBIA")).toBe("DISTRICTOFCOLUMBIA");
  });
});
