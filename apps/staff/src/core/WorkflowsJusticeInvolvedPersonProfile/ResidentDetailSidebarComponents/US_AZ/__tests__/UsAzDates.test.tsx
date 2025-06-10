// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { ResidentMetadata } from "~datatypes";

import { metadataToDates } from "../UsAzDates";

describe("UsAzDates metadataToDates tests", () => {
  const FAKE_DATES = {
    sedDate: new Date(2000, 1, 1),
    ercdDate: new Date(2000, 2, 2),
    csbdDate: new Date(2000, 3, 3),
    projectedCsbdDate: new Date(2000, 4, 4),
    acisTprDate: new Date(2000, 5, 5),
    projectedTprDate: new Date(2000, 6, 6),
    acisDtpDate: new Date(2000, 7, 7),
    projectedDtpDate: new Date(2000, 8, 8),
    csedDate: new Date(2000, 9, 9),
  };

  const FAKE_METADATA = {
    stateCode: "US_AZ",
    ...Object.fromEntries(
      Object.entries(FAKE_DATES).map(([key, value]) => [
        key,
        value.toISOString(),
      ]),
    ),
  } as ResidentMetadata<"US_AZ">;

  const FAKE_TOOLTIP = "TOOLTIP";

  it("shows Projected TPR, SED, and CSED when there is no real TPR date", () => {
    const metadataUnderTest = {
      ...FAKE_METADATA,
      acisTprDate: undefined,
    };
    const dates = metadataToDates(metadataUnderTest, false, FAKE_TOOLTIP);
    expect(dates).toEqual([
      {
        label: "Projected TPR",
        date: FAKE_DATES.projectedTprDate,
        tooltip: FAKE_TOOLTIP,
        highlight: true,
      },
      { label: "SED", date: FAKE_DATES.sedDate },
      { label: "CSED", date: FAKE_DATES.csedDate },
    ]);
  });

  it("shows Projected DTP, SED, and CSED when there is no real DTP date", () => {
    const metadataUnderTest = {
      ...FAKE_METADATA,
      acisDtpDate: undefined,
    };
    const dates = metadataToDates(metadataUnderTest, true, FAKE_TOOLTIP);
    expect(dates).toEqual([
      {
        label: "Projected DTP",
        date: FAKE_DATES.projectedDtpDate,
        tooltip: FAKE_TOOLTIP,
        highlight: true,
      },
      { label: "SED", date: FAKE_DATES.sedDate },
      { label: "CSED", date: FAKE_DATES.csedDate },
    ]);
  });

  it("shows real TPR and all other dates when there is a real TPR date", () => {
    const dates = metadataToDates(FAKE_METADATA, false, FAKE_TOOLTIP);
    expect(dates).toEqual([
      { label: "TPR", date: FAKE_DATES.acisTprDate },
      { label: "CSBD / TR to ADD", date: FAKE_DATES.csbdDate },
      { label: "ERCD", date: FAKE_DATES.ercdDate },
      { label: "SED", date: FAKE_DATES.sedDate },
      { label: "CSED", date: FAKE_DATES.csedDate },
    ]);
  });

  it("shows real DTP and all other dates when there is a real DTP date", () => {
    const dates = metadataToDates(FAKE_METADATA, true, FAKE_TOOLTIP);
    expect(dates).toEqual([
      { label: "DTP", date: FAKE_DATES.acisDtpDate },
      { label: "CSBD / TR to ADD", date: FAKE_DATES.csbdDate },
      { label: "ERCD", date: FAKE_DATES.ercdDate },
      { label: "SED", date: FAKE_DATES.sedDate },
      { label: "CSED", date: FAKE_DATES.csedDate },
    ]);
  });

  it("passes through null dates", () => {
    const metadataUnderTest = {
      ...FAKE_METADATA,
      ercdDate: undefined,
      csbdDate: undefined,
    };
    const dates = metadataToDates(metadataUnderTest, false, FAKE_TOOLTIP);
    expect(dates).toEqual([
      { label: "TPR", date: FAKE_DATES.acisTprDate },
      { label: "CSBD / TR to ADD", date: undefined },
      { label: "ERCD", date: undefined },
      { label: "SED", date: FAKE_DATES.sedDate },
      { label: "CSED", date: FAKE_DATES.csedDate },
    ]);
  });
});
