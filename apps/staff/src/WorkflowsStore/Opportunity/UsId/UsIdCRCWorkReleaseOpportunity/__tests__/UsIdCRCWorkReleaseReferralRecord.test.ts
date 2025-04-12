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

describe("UsIdCRCWorkReleaseReferralRecord", () => {
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
