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

import { usMoOverdueRestrictiveHousingInitialHearingReferralRecordFixture } from "../__fixtures__";
import { usMoOverdueRestrictiveHousingInitialHearingSchema } from "../UsMoOverdueRestrictiveHousingInitialHearingOpportunity";

describe("UsMoOverdueRestrictiveHousingInitialHearingReferralRecord", () => {
  it("should have a valid schema", () => {
    expect(
      usMoOverdueRestrictiveHousingInitialHearingSchema.parse(
        usMoOverdueRestrictiveHousingInitialHearingReferralRecordFixture
      )
    ).toMatchInlineSnapshot(`
      Object {
        "eligibleCriteria": Object {
          "usMoInRestrictiveHousing": Object {
            "confinementType": "COMMUNITY",
          },
          "usMoInitialHearingPastDueDate": Object {
            "dueDateInferred": true,
            "nextReviewDate": 2023-10-15T00:00:00.000Z,
          },
          "usMoNoActiveD1Sanctions": Object {
            "latestSanctionEndDate": 2023-12-05T00:00:00.000Z,
            "latestSanctionStartDate": 2023-08-15T00:00:00.000Z,
          },
        },
        "externalId": "rh-1",
        "ineligibleCriteria": Object {},
        "metadata": Object {
          "bedNumber": "03",
          "buildingNumber": "13",
          "cdvsSinceLastHearing": Array [],
          "complexNumber": "2",
          "currentFacility": "FACILITY 01",
          "housingUseCode": "123456",
          "majorCdvs": Array [
            Object {
              "cdvDate": 2022-02-20T00:00:00.000Z,
              "cdvRule": "Rule 7.2",
            },
          ],
          "mostRecentHearingComments": "Reason for Hearing: 30 day review",
          "mostRecentHearingDate": 2022-09-03T00:00:00.000Z,
          "mostRecentHearingFacility": "FACILITY NAME",
          "mostRecentHearingType": "hearing type",
          "numMinorCdvsBeforeLastHearing": 5,
          "restrictiveHousingStartDate": 2022-10-01T00:00:00.000Z,
          "roomNumber": "05",
        },
        "stateCode": "US_MO",
      }
    `);
  });
});
