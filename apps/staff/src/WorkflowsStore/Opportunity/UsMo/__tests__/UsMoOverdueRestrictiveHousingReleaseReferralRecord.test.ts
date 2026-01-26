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

import { maxBy } from "lodash";

import { usMoOverdueRestrictiveHousingReleaseReferralRecordFixture } from "../__fixtures__";
import { usMoOverdueRestrictiveHousingReleaseSchema } from "../UsMoOverdueRestrictiveHousingReleaseOpportunity/UsMoOverdueRestrictiveHousingReleaseReferralRecord";

const recordWithNullUsMoNoActiveProgressiveDisciplineSanctions = {
  ...usMoOverdueRestrictiveHousingReleaseReferralRecordFixture,
  eligibleCriteria: {
    ...usMoOverdueRestrictiveHousingReleaseReferralRecordFixture.eligibleCriteria,
    usMoNoActiveProgressiveDisciplineSanctions: null,
  },
  metadata: {
    ...usMoOverdueRestrictiveHousingReleaseReferralRecordFixture.metadata,
    allSanctions: [
      {
        sanctionCode: "D1",
        sanctionExpirationDate: "2023-12-05",
        sanctionId: 4000,
        sanctionStartDate: "2023-08-15",
      },
      {
        sanctionCode: "D1",
        sanctionExpirationDate: "2023-12-05",
        sanctionId: 4001,
        sanctionStartDate: "2023-08-24",
      },
    ],
  },
};

describe("UsMoOverdueRestrictiveHousingReleaseReferralRecord", () => {
  it("should have a valid schema", () => {
    expect(
      usMoOverdueRestrictiveHousingReleaseSchema.parse(
        usMoOverdueRestrictiveHousingReleaseReferralRecordFixture,
      ),
    ).toMatchInlineSnapshot(`
      {
        "caseNotes": {},
        "eligibleCriteria": {
          "usMoInRestrictiveHousing": {
            "confinementType": "COMMUNITY",
          },
          "usMoNoActiveProgressiveDisciplineSanctions": {
            "latestSanctionEndDate": 2023-12-05T00:00:00.000Z,
            "latestSanctionStartDate": 2023-08-15T00:00:00.000Z,
          },
          "usMoProgressiveDisciplineSanctionAfterMostRecentHearing": {
            "latestRestrictiveHousingHearingDate": 2023-09-20T00:00:00.000Z,
          },
          "usMoProgressiveDisciplineSanctionAfterRestrictiveHousingStart": {
            "latestProgressiveDisciplineSanctionStartDate": 2023-08-15T00:00:00.000Z,
            "restrictiveHousingStartDate": 2023-08-15T00:00:00.000Z,
          },
        },
        "externalId": "rh-1",
        "ineligibleCriteria": {},
        "isAlmostEligible": false,
        "isEligible": true,
        "metadata": {
          "bedNumber": "03",
          "buildingNumber": "13",
          "cdvsSinceLastHearing": [],
          "complexNumber": "2",
          "currentFacility": "FACILITY 01",
          "housingUseCode": "123456",
          "majorCdvs": [
            {
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

  it("should have a valid schema when usMoNoActiveProgressiveDisciplineSanctions is null and metadata allSanctions is undefined", () => {
    expect(
      usMoOverdueRestrictiveHousingReleaseSchema.parse({
        ...recordWithNullUsMoNoActiveProgressiveDisciplineSanctions,
        metadata: {
          ...recordWithNullUsMoNoActiveProgressiveDisciplineSanctions.metadata,
          allSanctions: undefined,
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "caseNotes": {},
        "eligibleCriteria": {
          "usMoInRestrictiveHousing": {
            "confinementType": "COMMUNITY",
          },
          "usMoNoActiveProgressiveDisciplineSanctions": null,
          "usMoProgressiveDisciplineSanctionAfterMostRecentHearing": {
            "latestRestrictiveHousingHearingDate": 2023-09-20T00:00:00.000Z,
          },
          "usMoProgressiveDisciplineSanctionAfterRestrictiveHousingStart": {
            "latestProgressiveDisciplineSanctionStartDate": 2023-08-15T00:00:00.000Z,
            "restrictiveHousingStartDate": 2023-08-15T00:00:00.000Z,
          },
        },
        "externalId": "rh-1",
        "ineligibleCriteria": {},
        "isAlmostEligible": false,
        "isEligible": true,
        "metadata": {
          "allSanctions": undefined,
          "bedNumber": "03",
          "buildingNumber": "13",
          "cdvsSinceLastHearing": [],
          "complexNumber": "2",
          "currentFacility": "FACILITY 01",
          "housingUseCode": "123456",
          "majorCdvs": [
            {
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

  it("should have a valid schema when usMoNoActiveProgressiveDisciplineSanctions is null and metadata allSanctions is defined", () => {
    expect(
      usMoOverdueRestrictiveHousingReleaseSchema.parse(
        recordWithNullUsMoNoActiveProgressiveDisciplineSanctions,
      ),
    ).toMatchInlineSnapshot(`
      {
        "caseNotes": {},
        "eligibleCriteria": {
          "usMoInRestrictiveHousing": {
            "confinementType": "COMMUNITY",
          },
          "usMoNoActiveProgressiveDisciplineSanctions": {
            "latestSanctionEndDate": 2023-12-05T00:00:00.000Z,
            "latestSanctionStartDate": 2023-08-24T00:00:00.000Z,
          },
          "usMoProgressiveDisciplineSanctionAfterMostRecentHearing": {
            "latestRestrictiveHousingHearingDate": 2023-09-20T00:00:00.000Z,
          },
          "usMoProgressiveDisciplineSanctionAfterRestrictiveHousingStart": {
            "latestProgressiveDisciplineSanctionStartDate": 2023-08-15T00:00:00.000Z,
            "restrictiveHousingStartDate": 2023-08-15T00:00:00.000Z,
          },
        },
        "externalId": "rh-1",
        "ineligibleCriteria": {},
        "isAlmostEligible": false,
        "isEligible": true,
        "metadata": {
          "allSanctions": [
            {
              "sanctionCode": "D1",
              "sanctionExpirationDate": 2023-12-05T00:00:00.000Z,
              "sanctionId": 4000,
              "sanctionStartDate": 2023-08-15T00:00:00.000Z,
            },
            {
              "sanctionCode": "D1",
              "sanctionExpirationDate": 2023-12-05T00:00:00.000Z,
              "sanctionId": 4001,
              "sanctionStartDate": 2023-08-24T00:00:00.000Z,
            },
          ],
          "bedNumber": "03",
          "buildingNumber": "13",
          "cdvsSinceLastHearing": [],
          "complexNumber": "2",
          "currentFacility": "FACILITY 01",
          "housingUseCode": "123456",
          "majorCdvs": [
            {
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

  it("should equal the latest sanction end date when usMoNoActiveProgressiveDisciplineSanctions is null", () => {
    const definedRecord = usMoOverdueRestrictiveHousingReleaseSchema.parse(
      recordWithNullUsMoNoActiveProgressiveDisciplineSanctions,
    );
    const { latestSanctionEndDate } = definedRecord.eligibleCriteria
      .usMoNoActiveProgressiveDisciplineSanctions ?? { undefined };
    const { allSanctions } = definedRecord.metadata;
    const latestSanction = allSanctions?.length
      ? maxBy(allSanctions, "sanctionStartDate")
      : undefined;

    expect(latestSanctionEndDate).toBeDefined();
    expect(latestSanctionEndDate).toEqual(
      latestSanction?.sanctionExpirationDate,
    );
  });
});
