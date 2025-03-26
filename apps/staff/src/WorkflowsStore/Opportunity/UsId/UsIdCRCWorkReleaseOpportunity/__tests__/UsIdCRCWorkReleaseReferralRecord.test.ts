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
  UsIdCRCWorkReleaseReferralRecordRaw,
  usIdCRCWorkReleaseSchema,
} from "../UsIdCRCWorkReleaseReferralRecord";

describe("UsIdCRCWorkReleaseReferralRecord (new schema)", () => {
  const rawRecord: UsIdCRCWorkReleaseReferralRecordRaw = {
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
      // usIdCrcWorkReleaseTimeBasedCriteria and should instead include
      // the time-based criteria named in the test name.
      usIdCrcWorkReleaseTimeBasedCriteria: {
        eligibleOffenses: null,
        fullTermCompletionDate: null,
        groupProjectedParoleReleaseDate: "2031-03-13",
        minTermCompletionDate: null,
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  };

  test("eligible record for incarcerationWithin18MonthsOfFtcdOrTpd", () => {
    expect(usIdCRCWorkReleaseSchema.parse(rawRecord)).toMatchSnapshot();
  });

  test("eligible record for incarcerationWithin18MonthsOfEprdAnd15YearsOfFtcd", () => {
    rawRecord.eligibleCriteria.usIdCrcWorkReleaseTimeBasedCriteria = {
      eligibleOffenses: null,
      fullTermCompletionDate: "2031-03-13",
      groupProjectedParoleReleaseDate: null,
      minTermCompletionDate: "2025-05-25",
    };
    expect(usIdCRCWorkReleaseSchema.parse(rawRecord)).toMatchSnapshot();
  });

  test("eligible record for incarcerationWithin1YearOfTpdAndLifeSentence", () => {
    rawRecord.eligibleCriteria.usIdCrcWorkReleaseTimeBasedCriteria = {
      eligibleOffenses: ["I00-0000", "I11-1111"],
      // people on life sentences have a FTCD far in the future
      fullTermCompletionDate: "9999-12-31",
      groupProjectedParoleReleaseDate: "2031-03-13",
      minTermCompletionDate: "9999-12-31",
    };
    expect(usIdCRCWorkReleaseSchema.parse(rawRecord)).toMatchSnapshot();
  });
});

// TODO(#7697) Remove old tests corresponding to old schema (below this line)
describe("UsIdCRCWorkReleaseReferralRecord", () => {
  let rawRecord: UsIdCRCWorkReleaseReferralRecordRaw;

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
        usIdCrcWorkReleaseTimeBasedCriteria: {
          reasons: [
            {
              criteriaName:
                "US_IX_INCARCERATION_WITHIN_18_MONTHS_OF_FTCD_OR_TPD",
              fullTermCompletionDate: "2023-10-10",
              tentativeParoleDate: null,
            },
            {
              criteriaName:
                "US_IX_INCARCERATION_WITHIN_18_MONTHS_OF_EPRD_AND_15_YEARS_OF_FTCD",
              fullTermCompletionDate: "2031-03-13",
              minTermCompletionDate: "2023-11-15",
            },
            {
              criteriaName:
                "US_IX_INCARCERATION_WITHIN_1_YEAR_OF_TPD_AND_LIFE_SENTENCE",
              tentativeParoleDate: "2024-08-14",
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
    expect(usIdCRCWorkReleaseSchema.parse(rawRecord)).toMatchSnapshot();
  });

  test("US_IX_INCARCERATION_WITHIN_18_MONTHS_OF_EPRD_AND_15_YEARS_OF_FTCD should be `undefined`", () => {
    expect(
      usIdCRCWorkReleaseSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin18MonthsOfEprdAnd15YearsOfFtcd,
    ).toBeUndefined();
  });

  test("US_IX_INCARCERATION_WITHIN_1_YEAR_OF_TPD_AND_LIFE_SENTENCE should be `undefined`", () => {
    expect(
      usIdCRCWorkReleaseSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin18MonthsOfFtcdOrTpd,
    ).not.toBeUndefined();
    expect(
      usIdCRCWorkReleaseSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin1YearOfTpdAndLifeSentence,
    ).toBeUndefined();
  });

  test("US_IX_INCARCERATION_WITHIN_1_YEAR_OF_TPD_AND_LIFE_SENTENCE and US_IX_INCARCERATION_WITHIN_18_MONTHS_OF_EPRD_AND_15_YEARS_OF_FTCD should be `undefined`", () => {
    // @ts-ignore
    rawRecord.eligibleCriteria.usIdCrcWorkReleaseTimeBasedCriteria.reasons.splice(
      1,
      1,
    );

    expect(
      usIdCRCWorkReleaseSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin18MonthsOfFtcdOrTpd,
    ).not.toBeUndefined();
    expect(
      usIdCRCWorkReleaseSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin1YearOfTpdAndLifeSentence,
    ).toBeUndefined();
    expect(
      usIdCRCWorkReleaseSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin18MonthsOfEprdAnd15YearsOfFtcd,
    ).toBeUndefined();
  });

  test("US_IX_INCARCERATION_WITHIN_18_MONTHS_OF_FTCD_OR_TPD and US_IX_INCARCERATION_WITHIN_1_YEAR_OF_TPD_AND_LIFE_SENTENCE should be `undefined`", () => {
    // @ts-ignore
    rawRecord.eligibleCriteria.usIdCrcWorkReleaseTimeBasedCriteria.reasons.splice(
      0,
      1,
    );

    expect(
      usIdCRCWorkReleaseSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin18MonthsOfFtcdOrTpd,
    ).toBeUndefined();
    expect(
      usIdCRCWorkReleaseSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin18MonthsOfEprdAnd15YearsOfFtcd,
    ).not.toBeUndefined();
    expect(
      usIdCRCWorkReleaseSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin1YearOfTpdAndLifeSentence,
    ).toBeUndefined();
  });

  test("US_IX_INCARCERATION_WITHIN_18_MONTHS_OF_FTCD_OR_TPD and US_IX_INCARCERATION_WITHIN_18_MONTHS_OF_EPRD_AND_15_YEARS_OF_FTCD should be `undefined`", () => {
    // @ts-ignore
    rawRecord.eligibleCriteria.usIdCrcWorkReleaseTimeBasedCriteria.reasons.splice(
      0,
      2,
    );
    expect(
      usIdCRCWorkReleaseSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin18MonthsOfEprdAnd15YearsOfFtcd,
    ).toBeUndefined();
    expect(
      usIdCRCWorkReleaseSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin18MonthsOfFtcdOrTpd,
    ).toBeUndefined();
    expect(
      usIdCRCWorkReleaseSchema.parse(rawRecord).eligibleCriteria
        .usIdIncarcerationWithin1YearOfTpdAndLifeSentence,
    ).not.toBeUndefined();
  });
});

test("transforms eligible record with life temporal criteria", () => {
  const rawRecord: UsIdCRCWorkReleaseReferralRecordRaw = {
    stateCode: "US_ID",
    externalId: "crc-work-release-eligible-02",
    eligibleCriteria: {
      custodyLevelIsMinimum: {
        custodyLevel: "MINIMUM",
      },
      notServingForSexualOffense: null,
      usIdNotDetainersForXcrcAndCrc: null,
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
      usIdCrcWorkReleaseTimeBasedCriteria: {
        reasons: [
          {
            criteriaName:
              "US_IX_INCARCERATION_WITHIN_1_YEAR_OF_TPD_AND_LIFE_SENTENCE",
            tentativeParoleDate: "2024-08-14",
          },
        ],
      },
    },
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
  };

  expect(usIdCRCWorkReleaseSchema.parse(rawRecord)).toMatchSnapshot();
});
