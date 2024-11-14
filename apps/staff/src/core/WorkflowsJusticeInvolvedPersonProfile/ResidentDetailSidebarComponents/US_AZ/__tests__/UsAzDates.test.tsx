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

import { UsAzResidentMetadata } from "../../../../../FirestoreStore";
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
  };

  const FAKE_METADATA = {
    stateCode: "US_AZ",
    ...Object.fromEntries(
      Object.entries(FAKE_DATES).map(([key, value]) => [
        key,
        value.toISOString(),
      ]),
    ),
  } as UsAzResidentMetadata;

  const FAKE_TOOLTIP = "TOOLTIP";

  it("shows SED and Projected TPR when there is no real TPR date", () => {
    const metadataUnderTest = {
      ...FAKE_METADATA,
      acisTprDate: null,
    };
    const dates = metadataToDates(metadataUnderTest, false, FAKE_TOOLTIP);
    expect(dates).toEqual([
      { label: "SED", date: FAKE_DATES.sedDate },
      {
        label: "Projected TPR",
        date: FAKE_DATES.projectedTprDate,
        tooltip: FAKE_TOOLTIP,
      },
    ]);
  });

  it("shows SED and Projected DTP when there is no real DTP date", () => {
    const metadataUnderTest = {
      ...FAKE_METADATA,
      acisDtpDate: null,
    };
    const dates = metadataToDates(metadataUnderTest, true, FAKE_TOOLTIP);
    expect(dates).toEqual([
      { label: "SED", date: FAKE_DATES.sedDate },
      {
        label: "Projected DTP",
        date: FAKE_DATES.projectedDtpDate,
        tooltip: FAKE_TOOLTIP,
      },
    ]);
  });

  it("shows SED, ERCD, CSBD, and TPR when there is a real TPR date", () => {
    const dates = metadataToDates(FAKE_METADATA, false, FAKE_TOOLTIP);
    expect(dates).toEqual([
      { label: "SED", date: FAKE_DATES.sedDate },
      { label: "ERCD", date: FAKE_DATES.ercdDate },
      { label: "CSBD", date: FAKE_DATES.csbdDate },
      { label: "TPR", date: FAKE_DATES.acisTprDate },
    ]);
  });

  it("shows SED, ERCD, CSBD, and DTP when there is a real DTP date", () => {
    const dates = metadataToDates(FAKE_METADATA, true, FAKE_TOOLTIP);
    expect(dates).toEqual([
      { label: "SED", date: FAKE_DATES.sedDate },
      { label: "ERCD", date: FAKE_DATES.ercdDate },
      { label: "CSBD", date: FAKE_DATES.csbdDate },
      { label: "DTP", date: FAKE_DATES.acisDtpDate },
    ]);
  });

  it("passes through null dates", () => {
    const metadataUnderTest = {
      ...FAKE_METADATA,
      ercdDate: null,
      csbdDate: null,
    };
    const dates = metadataToDates(metadataUnderTest, false, FAKE_TOOLTIP);
    expect(dates).toEqual([
      { label: "SED", date: FAKE_DATES.sedDate },
      { label: "ERCD", date: undefined },
      { label: "CSBD", date: undefined },
      { label: "TPR", date: FAKE_DATES.acisTprDate },
    ]);
  });
});
