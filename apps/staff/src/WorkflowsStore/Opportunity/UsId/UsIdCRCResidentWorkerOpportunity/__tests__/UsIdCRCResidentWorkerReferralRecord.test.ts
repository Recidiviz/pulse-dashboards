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
        usIdNoDetainersForXcrcAndCrc: null,
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
      usIdNoDetainersForXcrcAndCrc: null,
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
