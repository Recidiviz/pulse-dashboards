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

test("transforms eligible record with two temporal criteria", () => {
  const rawRecord: UsIdCRCWorkReleaseReferralRecordRaw = {
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
            criteriaName: "US_IX_INCARCERATION_WITHIN_18_MONTHS_OF_FTCD_OR_TPD",
            fullTermCompletionDate: "2023-10-10",
            tentativeParoleDate: null,
          },
          {
            criteriaName:
              "US_IX_INCARCERATION_WITHIN_18_MONTHS_OF_EPRD_AND_15_YEARS_OF_FTCD",
            fullTermCompletionDate: "2031-03-13",
            nextParoleHearingDate: "2023-11-15",
          },
        ],
      },
    },
    ineligibleCriteria: {},
  };

  expect(usIdCRCWorkReleaseSchema.parse(rawRecord)).toMatchSnapshot();
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
