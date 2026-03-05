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

import { ResidentMetadata } from "~datatypes";

import { SingleResidentContextPresenter } from "./SingleResidentContextPresenter";

const testData: ResidentMetadata<"US_AZ"> = {
  stateCode: "US_AZ",
  isDprEligible: false,
  hasAnyDprProgramCompleted: false,
  // realistically a person would not be expected to have all these dates,
  // but this is convenient for testing and the DPR flags should determine the logic anyway
  sedDateRaw: "2026-03-01",
  acisTprDateRaw: "2026-03-02",
  acisDtpDateRaw: "2026-03-03",
  csbdDateRaw: "2026-03-04",
  ercdDateRaw: "2026-03-05",
  csedDateRaw: "2026-03-06",
  addDateRaw: "2026-03-07",
  trToAddDateRaw: "2026-03-08",
  dprTprDateRaw: new Date(2027, 2, 2),
  dprDtpDateRaw: new Date(2027, 2, 3),
  dprCsbdDateRaw: new Date(2027, 2, 4),
  dprErcdDateRaw: new Date(2027, 2, 5),
  dprCsedDateRaw: new Date(2027, 2, 6),
  dprAddDateRaw: new Date(2027, 2, 7),
  dprTrToAddDateRaw: new Date(2027, 2, 8),
};

// these are parsed versions of the raw strings
const expectedTisDates = {
  sedDate: new Date(2026, 2, 1),
  tprDate: new Date(2026, 2, 2),
  dtpDate: new Date(2026, 2, 3),
  csbdDate: new Date(2026, 2, 4),
  ercdDate: new Date(2026, 2, 5),
  csedDate: new Date(2026, 2, 6),
  addDate: new Date(2026, 2, 7),
  trToAddDate: new Date(2026, 2, 8),
};

const expectedDprDates = {
  // this is the parsed version of the raw string
  sedDate: new Date(2026, 2, 1),
  // the rest of these are the same as the dpr-prefixed values
  tprDate: new Date(2027, 2, 2),
  dtpDate: new Date(2027, 2, 3),
  csbdDate: new Date(2027, 2, 4),
  ercdDate: new Date(2027, 2, 5),
  csedDate: new Date(2027, 2, 6),
  addDate: new Date(2027, 2, 7),
  trToAddDate: new Date(2027, 2, 8),
};

let presenter: SingleResidentContextPresenter;

describe("DPR ineligible", () => {
  beforeEach(() => {
    presenter = new SingleResidentContextPresenter(testData);
  });

  test("DPR qualified", () => {
    expect(presenter.isDprQualified).toBeFalse();
  });

  test("DPR active", () => {
    expect(presenter.isDprActive).toBeFalse();
  });

  test("dates", () => {
    expect(presenter.activeDates).toEqual(expectedTisDates);
  });
});

describe("DPR qualified", () => {
  beforeEach(() => {
    presenter = new SingleResidentContextPresenter({
      ...testData,
      isDprEligible: true,
    });
  });

  test("DPR qualified", () => {
    expect(presenter.isDprQualified).toBeTrue();
  });

  test("DPR active", () => {
    expect(presenter.isDprActive).toBeFalse();
  });

  test("dates", () => {
    expect(presenter.activeDates).toEqual(expectedTisDates);
  });
});

describe("DPR active", () => {
  beforeEach(() => {
    presenter = new SingleResidentContextPresenter({
      ...testData,
      isDprEligible: true,
      hasAnyDprProgramCompleted: true,
    });
  });

  test("DPR qualified", () => {
    expect(presenter.isDprQualified).toBeFalse();
  });

  test("DPR active", () => {
    expect(presenter.isDprActive).toBeTrue();
  });

  test("dates", () => {
    expect(presenter.activeDates).toEqual(expectedDprDates);
  });
});
