// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
        usIdNoDetainersForXcrcAndCrc: null,
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
      usIdNoDetainersForXcrcAndCrc: null,
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
  };

  expect(usIdCRCWorkReleaseSchema.parse(rawRecord)).toMatchSnapshot();
});
