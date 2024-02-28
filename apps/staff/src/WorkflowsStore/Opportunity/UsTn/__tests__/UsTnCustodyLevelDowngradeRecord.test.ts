// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
  UsTnCustodyLevelDowngradeReferralRecordRaw,
  usTnCustodyLevelDowngradeSchema,
} from "../UsTnCustodyLevelDowngradeOpportunity/UsTnCustodyLevelDowngradeReferralRecord";

const usTnCustodyLevelDowngradeRecordRaw: UsTnCustodyLevelDowngradeReferralRecordRaw =
  {
    stateCode: "US_XX",
    externalId: "abc123",
    eligibleCriteria: {
      custodyLevelHigherThanRecommended: {
        recommendedCustodyLevel: "HIGH",
        custodyLevel: "MAXIMUM",
      },
      custodyLevelIsNotMax: null,
      usTnLatestCafAssessmentNotOverride: {
        overrideReason: "Some reason",
      },
      usTnIneligibleForAnnualReclassification: {
        ineligibleCriteria: ["Some reason"],
      },
    },
    ineligibleCriteria: {},
    formInformation: {
      activeRecommendations: [],
      classificationType: "SPECIAL",
      hasIncompatibles: false,
      incompatibleArray: [],
      statusAtHearingSeg: "GEN",
      currentOffenses: ["ROBBERY-ARMED WITH DEADLY WEAPON"],
      lastCafDate: "2022-08-22",
      lastCafTotal: "8",
      q1Score: 1,
      q2Score: 1,
      q3Score: 1,
      q4Score: 1,
      q5Score: 1,
      q6Score: 1,
      q7Score: 1,
      q8Score: 1,
      q9Score: 1,
      q6Notes: [{ eventDate: "2022-08-22", noteBody: "Some note" }],
      q7Notes: [{ eventDate: "2022-08-22", noteBody: "Some note" }],
      q8Notes: [
        {
          detainerReceivedDate: "2022-08-22",
          detainerFelonyFlag: "X",
          detainerMisdemeanorFlag: "X",
        },
      ],
    },
  };

test("record is properly parsed for opportunity", () => {
  expect(
    usTnCustodyLevelDowngradeSchema.parse(usTnCustodyLevelDowngradeRecordRaw),
  ).toMatchSnapshot();
});
