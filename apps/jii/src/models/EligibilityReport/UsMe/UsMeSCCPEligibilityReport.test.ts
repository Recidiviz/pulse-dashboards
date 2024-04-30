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

import { outputFixture, usMeResidents, usMeSccpFixtures } from "~datatypes";

import { residentsConfigByState } from "../../../configs/residentsConfig";
import { UsMeSCCPEligibilityReport } from "./UsMeSCCPEligibilityReport";

let report: UsMeSCCPEligibilityReport;

describe("fully eligible, needs to serve half", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      residentsConfigByState.US_ME.incarcerationOpportunities.usMeSCCP,
      outputFixture(usMeSccpFixtures.fullyEligibleHalfPortion),
    );
  });

  test("headline", () => {
    expect(report.headline).toMatchInlineSnapshot(
      `"First, you could be eligible to apply for the Supervised Community Confinement Program"`,
    );
  });

  test("subheading", () => {
    expect(report.subheading).toMatchInlineSnapshot(
      `"You became eligible for release onto SCCP on September 16, 2021. You can apply as soon as you meet all the requirements."`,
    );
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      {
        "requirementsMet": [
          "Served 1/2 of your sentence",
          "Fewer than 30 months remaining on your sentence",
          "No Class A or B discipline in past 90 days",
          "Current custody level is Community",
          "No unresolved detainers, warrants or pending charges",
        ],
        "requirementsNotMet": [],
      }
    `);
  });
});

describe("eligible to apply before X portion served", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      residentsConfigByState.US_ME.incarcerationOpportunities.usMeSCCP,
      outputFixture(usMeSccpFixtures.eligibleToApplyBeforeXPortionServed),
    );
  });

  test("headline", () => {
    expect(report.headline).toMatchInlineSnapshot(
      `"First, you could be eligible to apply for the Supervised Community Confinement Program"`,
    );
  });

  test("subheading", () => {
    expect(report.subheading).toMatchInlineSnapshot(
      `"You could be eligible for release onto SCCP on February 16, 2022. You can apply as soon as you meet all the requirements."`,
    );
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      {
        "requirementsMet": [
          "Fewer than 30 months remaining on your sentence",
          "No Class A or B discipline in past 90 days",
          "Current custody level is Minimum",
          "No unresolved detainers, warrants or pending charges",
        ],
        "requirementsNotMet": [
          {
            "criterion": "Served 2/3 of your sentence",
            "ineligibleReason": "You'll meet this requirement on February 16, 2022",
          },
        ],
      }
    `);
  });
});

describe("eligible to apply before X months remaining", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      residentsConfigByState.US_ME.incarcerationOpportunities.usMeSCCP,
      outputFixture(usMeSccpFixtures.eligibleToApplyBeforeXMonthsRemaining),
    );
  });

  test("headline", () => {
    expect(report.headline).toMatchInlineSnapshot(
      `"First, you could be eligible to apply for the Supervised Community Confinement Program"`,
    );
  });

  test("subheading", () => {
    expect(report.subheading).toMatchInlineSnapshot(
      `"You could be eligible for release onto SCCP on February 16, 2022. You can apply as soon as you meet all the requirements."`,
    );
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      {
        "requirementsMet": [
          "Served 2/3 of your sentence",
          "No Class A or B discipline in past 90 days",
          "Current custody level is Minimum",
          "No unresolved detainers, warrants or pending charges",
        ],
        "requirementsNotMet": [
          {
            "criterion": "Fewer than 30 months remaining on your sentence",
            "ineligibleReason": "You'll meet this requirement on February 16, 2022",
          },
        ],
      }
    `);
  });
});

describe("almost eligible, portion served", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      residentsConfigByState.US_ME.incarcerationOpportunities.usMeSCCP,
      outputFixture(usMeSccpFixtures.almostEligibleXPortion),
    );
  });

  test("headline", () => {
    expect(report.headline).toMatchInlineSnapshot(
      `"First, you could be eligible to apply for the Supervised Community Confinement Program on February 16, 2022"`,
    );
  });

  test("subheading", () => {
    expect(report.subheading).toMatchInlineSnapshot(
      `"You could be eligible for release onto SCCP on May 16, 2022. You can apply up to 3 months prior to that date — as soon as February 16, 2022."`,
    );
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      {
        "requirementsMet": [
          "Fewer than 30 months remaining on your sentence",
          "No Class A or B discipline in past 90 days",
          "Current custody level is Community",
          "No unresolved detainers, warrants or pending charges",
        ],
        "requirementsNotMet": [
          {
            "criterion": "Served 1/2 of your sentence",
            "ineligibleReason": "You'll meet this requirement on May 16, 2022",
          },
        ],
      }
    `);
  });
});

describe("almost eligible, recent violation", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      residentsConfigByState.US_ME.incarcerationOpportunities.usMeSCCP,
      outputFixture(usMeSccpFixtures.almostEligibleRecentViolation),
    );
  });

  test("headline", () => {
    expect(report.headline).toMatchInlineSnapshot(
      `"First, you could be eligible to apply for the Supervised Community Confinement Program"`,
    );
  });

  test("subheading", () => {
    expect(report.subheading).toMatchInlineSnapshot(
      `"You became eligible for release onto SCCP on September 16, 2021. You can apply as soon as you meet all the requirements."`,
    );
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      {
        "requirementsMet": [
          "Served 1/2 of your sentence",
          "Fewer than 30 months remaining on your sentence",
          "Current custody level is Minimum",
          "No unresolved detainers, warrants or pending charges",
        ],
        "requirementsNotMet": [
          {
            "criterion": "No Class A or B discipline in past 90 days",
            "ineligibleReason": "You'll meet this requirement on March 2, 2022",
          },
        ],
      }
    `);
  });
});

describe("almost eligible, pending violation", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      residentsConfigByState.US_ME.incarcerationOpportunities.usMeSCCP,
      outputFixture(usMeSccpFixtures.almostEligiblePendingViolation),
    );
  });

  test("headline", () => {
    expect(report.headline).toMatchInlineSnapshot(
      `"First, you could be eligible to apply for the Supervised Community Confinement Program"`,
    );
  });

  test("subheading", () => {
    expect(report.subheading).toMatchInlineSnapshot(
      `"You became eligible for release onto SCCP on September 16, 2021. You can apply as soon as you meet all the requirements."`,
    );
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      {
        "requirementsMet": [
          "Served 1/2 of your sentence",
          "Fewer than 30 months remaining on your sentence",
          "Current custody level is Minimum",
          "No unresolved detainers, warrants or pending charges",
        ],
        "requirementsNotMet": [
          {
            "criterion": "No Class A or B discipline in past 90 days",
            "ineligibleReason": "You have a Class B violation: Pending since 2021-09-06",
          },
        ],
      }
    `);
  });
});

describe("almost eligible, months remaining", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      residentsConfigByState.US_ME.incarcerationOpportunities.usMeSCCP,
      outputFixture(usMeSccpFixtures.almostEligibleMonthsRemaining),
    );
  });

  test("headline", () => {
    expect(report.headline).toMatchInlineSnapshot(
      `"First, you could be eligible to apply for the Supervised Community Confinement Program on February 16, 2022"`,
    );
  });

  test("subheading", () => {
    expect(report.subheading).toMatchInlineSnapshot(
      `"You could be eligible for release onto SCCP on May 16, 2022. You can apply up to 3 months prior to that date — as soon as February 16, 2022."`,
    );
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      {
        "requirementsMet": [
          "Served 2/3 of your sentence",
          "No Class A or B discipline in past 90 days",
          "Current custody level is Community",
          "No unresolved detainers, warrants or pending charges",
        ],
        "requirementsNotMet": [
          {
            "criterion": "Fewer than 30 months remaining on your sentence",
            "ineligibleReason": "You'll meet this requirement on May 16, 2022",
          },
        ],
      }
    `);
  });
});

describe("not eligible", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      residentsConfigByState.US_ME.incarcerationOpportunities.usMeSCCP,
      undefined,
    );
  });

  test("headline", () => {
    expect(report.headline).toMatchInlineSnapshot(
      `"First, you are not currently eligible to apply for the Supervised Community Confinement Program"`,
    );
  });

  test("subheading", () => {
    expect(report.subheading).toMatchInlineSnapshot(`""`);
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      {
        "requirementsMet": [],
        "requirementsNotMet": [],
      }
    `);
  });
});
