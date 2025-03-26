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

import {
  UsIdCRCResidentWorkerReferralRecordRaw,
  usIdCRCResidentWorkerSchema,
} from "../UsIdCRCResidentWorkerReferralRecord";

describe("UsIdCRCResidentWorkerReferralRecord (new schema)", () => {
  const rawRecord: UsIdCRCResidentWorkerReferralRecordRaw = {
    stateCode: "US_ID",
    externalId: "testCRC01",
    eligibleCriteria: {
      custodyLevelIsMinimum: {
        custodyLevel: "MINIMUM",
      },
      notServingForSexualOffense: null,
      usIdNotDetainersForXcrcAndCrc: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      // The resulting snapshot for each test should no longer include
      // usIdCrcResidentWorkerTimeBasedCriteria and should instead include
      // the time-based criteria named in the test name.
      usIdCrcResidentWorkerTimeBasedCriteria: {
        eligibleOffenses: null,
        fullTermCompletionDate: "2031-03-13",
        groupProjectedParoleReleaseDate: "2031-03-13",
        paroleEligibilityDate: null,
        nextParoleHearingDate: null,
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  };

  test("eligible record with incarcerationWithin7YearsOfFtcdOrTpd", () => {
    expect(usIdCRCResidentWorkerSchema.parse(rawRecord)).toMatchSnapshot();
  });

  test("eligible record for incarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcd", () => {
    rawRecord.eligibleCriteria.usIdCrcResidentWorkerTimeBasedCriteria = {
      eligibleOffenses: null,
      fullTermCompletionDate: "2031-03-13",
      groupProjectedParoleReleaseDate: null,
      paroleEligibilityDate: "2000-01-01",
      nextParoleHearingDate: "2002-02-02",
    };
    expect(usIdCRCResidentWorkerSchema.parse(rawRecord)).toMatchSnapshot();
  });

  test("eligible record for incarcerationWithin3YearsOfTpdAndLifeSentence", () => {
    rawRecord.eligibleCriteria.usIdCrcResidentWorkerTimeBasedCriteria = {
      eligibleOffenses: ["I00-0000", "I11-1111"],
      // people on life sentences have a FTCD far in the future
      fullTermCompletionDate: "9999-12-31",
      groupProjectedParoleReleaseDate: "2031-03-13",
      paroleEligibilityDate: "2000-01-01",
      nextParoleHearingDate: "2002-02-02",
    };
    expect(usIdCRCResidentWorkerSchema.parse(rawRecord)).toMatchSnapshot();
  });
});

// TODO(#7697) Remove old tests corresponding to old schema (below this line)
describe("UsIdCRCResidentWorkerReferralRecord multiple criteria", () => {
  let rawRecord: UsIdCRCResidentWorkerReferralRecordRaw;

  beforeEach(() => {
    rawRecord = {
      stateCode: "US_ID",
      externalId: "crc-work-release-eligible-01",
      eligibleCriteria: {
        custodyLevelIsMinimum: {
          custodyLevel: "MINIMUM",
        },
        notServingForSexualOffense: null,
        usIdNotDetainersForXcrcAndCrc: null,
        usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
        usIdCrcResidentWorkerTimeBasedCriteria: {
          reasons: [
            {
              criteriaName: "US_IX_INCARCERATION_WITHIN_7_YEARS_OF_FTCD_OR_TPD",
              fullTermCompletionDate: "2023-10-10",
              tentativeParoleDate: null,
            },
            {
              criteriaName:
                "US_IX_INCARCERATION_WITHIN_7_YEARS_OF_PED_AND_PHD_AND_20_YEARS_OF_FTCD",
              fullTermCompletionDate: "2031-03-13",
              nextParoleHearingDate: "2025-11-15",
              paroleEligibilityDate: "2025-11-12",
            },
            {
              criteriaName:
                "US_IX_INCARCERATION_WITHIN_3_YEARS_OF_TPD_AND_LIFE_SENTENCE",
              tentativeParoleDate: "2025-08-14",
            },
          ],
        },
      },
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
    };
  });

  test("transforms eligible record with multiple temporal criteria", () => {
    expect(usIdCRCResidentWorkerSchema.parse(rawRecord)).toMatchSnapshot();
  });

  test("US_IX_INCARCERATION_WITHIN_7_YEARS_OF_PED_AND_PHD_AND_20_YEARS_OF_FTCD should be `undefined`", () => {
    expect(
      usIdCRCResidentWorkerSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcd,
    ).toBeUndefined();
  });

  test("US_IX_INCARCERATION_WITHIN_3_YEARS_OF_TPD_AND_LIFE_SENTENCE should be `undefined`", () => {
    expect(
      usIdCRCResidentWorkerSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin3YearsOfTpdAndLifeSentence,
    ).toBeUndefined();
  });

  test("US_IX_INCARCERATION_WITHIN_3_YEARS_OF_TPD_AND_LIFE_SENTENCE and US_IX_INCARCERATION_WITHIN_7_YEARS_OF_PED_AND_PHD_AND_20_YEARS_OF_FTCD should be `undefined`", () => {
    // @ts-ignore
    rawRecord.eligibleCriteria.usIdCrcResidentWorkerTimeBasedCriteria.reasons.splice(
      1,
      1,
    );

    expect(
      usIdCRCResidentWorkerSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin3YearsOfTpdAndLifeSentence,
    ).toBeUndefined();
  });

  test("US_IX_INCARCERATION_WITHIN_7_YEARS_OF_FTCD_OR_TPD and US_IX_INCARCERATION_WITHIN_3_YEARS_OF_TPD_AND_LIFE_SENTENCE should be `undefined`", () => {
    // @ts-ignore
    rawRecord.eligibleCriteria.usIdCrcResidentWorkerTimeBasedCriteria.reasons.splice(
      0,
      1,
    );

    expect(
      usIdCRCResidentWorkerSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcd,
    ).not.toBeUndefined();

    expect(
      usIdCRCResidentWorkerSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin7YearsOfFtcdOrTpd,
    ).toBeUndefined();

    expect(
      usIdCRCResidentWorkerSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin3YearsOfTpdAndLifeSentence,
    ).toBeUndefined();
  });

  test("US_IX_INCARCERATION_WITHIN_7_YEARS_OF_FTCD_OR_TPD and US_IX_INCARCERATION_WITHIN_7_YEARS_OF_PED_AND_PHD_AND_20_YEARS_OF_FTCD should be `undefined`", () => {
    // @ts-ignore
    rawRecord.eligibleCriteria.usIdCrcResidentWorkerTimeBasedCriteria.reasons.splice(
      0,
      2,
    );
    expect(
      usIdCRCResidentWorkerSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin3YearsOfTpdAndLifeSentence,
    ).not.toBeUndefined();
    expect(
      usIdCRCResidentWorkerSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin7YearsOfFtcdOrTpd,
    ).toBeUndefined();
    expect(
      usIdCRCResidentWorkerSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcd,
    ).toBeUndefined();
  });
});
test("transforms eligible record with life temporal criteria", () => {
  const rawRecord: UsIdCRCResidentWorkerReferralRecordRaw = {
    stateCode: "US_ID",
    externalId: "crc-work-release-eligible-02",
    eligibleCriteria: {
      usIdNotDetainersForXcrcAndCrc: null,
      custodyLevelIsMinimum: {
        custodyLevel: "MINIMUM",
      },
      notServingForSexualOffense: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      usIdCrcResidentWorkerTimeBasedCriteria: {
        reasons: [
          {
            criteriaName:
              "US_IX_INCARCERATION_WITHIN_3_YEARS_OF_TPD_AND_LIFE_SENTENCE",
            tentativeParoleDate: "2025-08-14",
          },
        ],
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  };

  expect(usIdCRCResidentWorkerSchema.parse(rawRecord)).toMatchSnapshot();
});
