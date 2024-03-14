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

import { baseUsMoOverdueRestrictiveHousingReferralRecordFixture } from "../__fixtures__";
import {
  BaseUsMoOverdueRestrictiveHousingReferralRecordRaw,
  baseUsMoOverdueRestrictiveHousingSchema,
} from "../UsMoOverdueRestrictiveHousingOpportunityBase/UsMoOverdueRestrictiveHousingReferralRecord";

test("validateReferral", () => {
  expect(
    baseUsMoOverdueRestrictiveHousingSchema.parse(
      baseUsMoOverdueRestrictiveHousingReferralRecordFixture<BaseUsMoOverdueRestrictiveHousingReferralRecordRaw>(
        1,
      ),
    ),
  ).toMatchInlineSnapshot(`
    {
      "eligibleCriteria": {
        "usMoInRestrictiveHousing": {
          "confinementType": "COMMUNITY",
        },
        "usMoNoActiveD1Sanctions": {
          "latestSanctionEndDate": 2023-12-05T00:00:00.000Z,
          "latestSanctionStartDate": 2023-08-15T00:00:00.000Z,
        },
      },
      "externalId": "rh-1",
      "ineligibleCriteria": {},
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

const baseRecord =
  baseUsMoOverdueRestrictiveHousingReferralRecordFixture<BaseUsMoOverdueRestrictiveHousingReferralRecordRaw>(
    1,
  );

const createMostRecentHearingCommentsTestCase = (
  mostRecentHearingComments?: string,
) => {
  const metadataWithHearingCommentsCase = baseRecord;
  metadataWithHearingCommentsCase.metadata.mostRecentHearingComments =
    mostRecentHearingComments;
  return baseUsMoOverdueRestrictiveHousingSchema.parse(
    metadataWithHearingCommentsCase,
  ).metadata.mostRecentHearingComments;
};

describe("test mostRecentHearingComments parser", () => {
  test("when it is undefined", () => {
    expect(createMostRecentHearingCommentsTestCase()).toMatchInlineSnapshot(
      `undefined`,
    );
  });

  test("when all sections are filled", () => {
    expect(
      createMostRecentHearingCommentsTestCase(
        "Reason for Hearing: Resident Boy, Carter #111111 was assigned. Resident Statement: None. Summary of Findings: Lorem Ipsum Recommendation: Continue.",
      ),
    ).toMatchInlineSnapshot(`
      {
        "reasonForHearing": "Resident Boy, Carter #111111 was assigned.",
        "recommendation": "Continue.",
        "residentStatement": "None.",
        "summaryOfFindings": "Lorem Ipsum",
      }
    `);
  });

  test("when the string is a space", () => {
    expect(createMostRecentHearingCommentsTestCase(" ")).toMatchInlineSnapshot(
      `undefined`,
    );
  });

  test("when the string is empty", () => {
    expect(createMostRecentHearingCommentsTestCase(" ")).toMatchInlineSnapshot(
      `undefined`,
    );
  });

  test("when Recommendations instead of Recommendation is used", () => {
    expect(
      createMostRecentHearingCommentsTestCase(
        "Reason for Hearing: Resident Boy, Carter #111111 was assigned. Offender Statement: None. Summary of Findings: Lorem Ipsum Recommendations: Continue.",
      ),
    ).toMatchInlineSnapshot(`
      {
        "reasonForHearing": "Resident Boy, Carter #111111 was assigned.",
        "recommendation": "Continue.",
        "residentStatement": "None.",
        "summaryOfFindings": "Lorem Ipsum",
      }
    `);
  });

  test("when Offender Statement is used instead of Resident Statement", () => {
    expect(
      createMostRecentHearingCommentsTestCase(
        "Reason for Hearing: Resident Boy, Carter #111111 was assigned. Offender Statement: None. Summary of Findings: Lorem Ipsum Recommendation: Continue.",
      ),
    ).toMatchInlineSnapshot(`
      {
        "reasonForHearing": "Resident Boy, Carter #111111 was assigned.",
        "recommendation": "Continue.",
        "residentStatement": "None.",
        "summaryOfFindings": "Lorem Ipsum",
      }
    `);
  });

  test("when both Resident and Offender statement are present", () => {
    expect(
      createMostRecentHearingCommentsTestCase(
        "Reason for Hearing: Resident Boy, Carter #111111 was assigned. Resident Statement: None. Offender Statement: None. Summary of Findings: Lorem Ipsum Recommendation: Continue.",
      ),
    ).toMatchInlineSnapshot(`
      {
        "offenderStatement": "None.",
        "reasonForHearing": "Resident Boy, Carter #111111 was assigned.",
        "recommendation": "Continue.",
        "residentStatement": "None.",
        "summaryOfFindings": "Lorem Ipsum",
      }
    `);
  });

  test("when multiple sections are empty", () => {
    expect(
      createMostRecentHearingCommentsTestCase(
        "Reason for Hearing: Resident Statement: Offender Statement: Summary of Findings: Recommendation:",
      ),
    ).toMatchInlineSnapshot(`
      {
        "reasonForHearing": undefined,
        "recommendation": undefined,
        "residentStatement": undefined,
        "summaryOfFindings": undefined,
      }
    `);
  });

  test("when Recommendation is missing", () => {
    expect(
      createMostRecentHearingCommentsTestCase(
        "Reason for Hearing: Test fails to parse Resident Statement: Offender Statement: Summary of Findings:",
      ),
    ).toMatchInlineSnapshot(
      `"Reason for Hearing: Test fails to parse Resident Statement: Offender Statement: Summary of Findings:"`,
    );
  });

  test("when a section prior to Recommendation is missing", () => {
    expect(
      createMostRecentHearingCommentsTestCase(
        "Reason for Hearing: Test fails to parse Summary of Findings: Recommendation:",
      ),
    ).toMatchInlineSnapshot(`
      {
        "reasonForHearing": "Test fails to parse",
        "recommendation": undefined,
        "residentStatement": undefined,
        "summaryOfFindings": undefined,
      }
    `);
  });

  test("when there are no sections ", () => {
    expect(
      createMostRecentHearingCommentsTestCase("Test without any sections"),
    ).toMatchInlineSnapshot(`"Test without any sections"`);
  });
});
