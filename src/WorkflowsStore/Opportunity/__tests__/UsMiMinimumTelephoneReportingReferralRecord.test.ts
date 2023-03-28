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

import { transformReferral } from "../UsMiMinimumTelephoneReportingReferralRecord";

test("transform record", () => {
  const rawRecord = {
    stateCode: "US_MI",
    externalId: "abc123",

    criteria: {
      sixMonthsPastSuperivionStart: {
        eligibleDate: "2022-12-12",
      },
      usMiNotServingAnOuilOrOwi: {
        ineligibleOffenses: [],
      },
      initialCompassScoreMinimumOrMedium: {
        assessmentLevel: "HIGH",
        eligibleDate: "2023-04-10",
      },
      usMiNotServingIneligibleOffensesOnSupervision: {
        ineligibleOffenses: [],
      },
      supervisionNotWithin90DaysOfFullTermDischarge: {
        eligibleDate: "2021-10-10",
      },
    },
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});
