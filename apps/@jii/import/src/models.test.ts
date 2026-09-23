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

import { cloneDeep } from "lodash-es";
import tk from "timekeeper";

import {
  CURRENT_DATE_STRING_FIXTURE,
  setDateshift,
  withDateshift,
} from "~datatypes";

import { residentImportSchema, rnaWritebackImportSchema } from "./models";

const testDate = new Date(2024, 2, 25);
// CURRENT_DATE_STRING_FIXTURE is not a month boundary, so it shifts to exactly "today"
const shiftedFixtureDate = "2024-03-25";

function usNdResident(stateSpecificData: Record<string, unknown>) {
  return {
    stateCode: "US_ND",
    personExternalId: "RES001",
    pseudonymizedId: "anonres001",
    displayId: "d001",
    personName: { givenNames: "Given", surname: "Sur" },
    stateSpecificData,
  };
}

const usNdSSD = {
  stateCode: "US_ND",
  paroleReviewDate: CURRENT_DATE_STRING_FIXTURE,
  goodTimeDate: CURRENT_DATE_STRING_FIXTURE,
};

beforeEach(() => {
  setDateshift(false);
  tk.freeze(testDate);
});

afterEach(() => {
  tk.reset();
});

describe("residentImportSchema stateSpecificData", () => {
  test("stores SSD unchanged when dateshift is off", () => {
    const parsed = residentImportSchema.parse(usNdResident(usNdSSD));

    expect(parsed.stateSpecificData).toEqual(usNdSSD);
  });

  test("stores shifted dates as bare date strings when dateshift is on", () => {
    const parsed = withDateshift(() =>
      residentImportSchema.parse(usNdResident(usNdSSD)),
    );

    expect(parsed.stateSpecificData).toEqual({
      stateCode: "US_ND",
      paroleReviewDate: shiftedFixtureDate,
      goodTimeDate: shiftedFixtureDate,
    });
  });

  test("does not mutate the source fixture object", () => {
    // seed fixtures are shared module-level objects reused across states and reruns,
    // so a mutation here would compound on the next parse
    const ssd = cloneDeep(usNdSSD);
    const record = usNdResident(ssd);

    withDateshift(() => residentImportSchema.parse(record));

    expect(ssd).toEqual(usNdSSD);
  });

  test("is stable across repeated parses of the same fixture", () => {
    const ssd = cloneDeep(usNdSSD);
    const record = usNdResident(ssd);

    const first = withDateshift(() => residentImportSchema.parse(record));
    const second = withDateshift(() => residentImportSchema.parse(record));

    expect(second.stateSpecificData).toEqual(first.stateSpecificData);
  });

  test("still reports SSD validation failures", () => {
    const invalid = usNdResident({
      stateCode: "US_ND",
      paroleReviewDate: "not a date",
    });

    expect(residentImportSchema.safeParse(invalid).success).toBe(false);
    expect(
      withDateshift(() => residentImportSchema.safeParse(invalid)).success,
    ).toBe(false);
  });

  test("passes through SSD for a state with no registered schema", () => {
    const ssd = { stateCode: "US_ID", someDate: CURRENT_DATE_STRING_FIXTURE };
    const record = { ...usNdResident(ssd), stateCode: "US_ID" };

    const parsed = withDateshift(() => residentImportSchema.parse(record));

    expect(parsed.stateSpecificData).toEqual(ssd);
  });
});

describe("rnaWritebackImportSchema", () => {
  const rnaRecord = {
    pseudonymizedId: "anonres001",
    opusId: "RES001",
    seqNumber: "002",
    admitDate: CURRENT_DATE_STRING_FIXTURE,
  };

  // admitDate and seqNumber together identify a specific RNA instance for a person:
  // latestRNAIsStale compares them to the ones stored on the RNA by exact equality. If a
  // reseed moved admitDate, every existing RNA would become stale.
  test("does not shift admitDate, which is used as an identifier", () => {
    const parsed = withDateshift(() =>
      rnaWritebackImportSchema.parse(rnaRecord),
    );

    expect(parsed.admitDate).toEqual(new Date(2021, 11, 16));
  });

  test("parses identically whether or not dateshift is enabled", () => {
    const shifted = withDateshift(() =>
      rnaWritebackImportSchema.parse(rnaRecord),
    );

    expect(shifted).toEqual(rnaWritebackImportSchema.parse(rnaRecord));
  });
});
