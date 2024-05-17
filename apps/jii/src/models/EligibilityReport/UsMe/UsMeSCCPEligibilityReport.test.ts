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
import { OpportunityConfig } from "../../../configs/types";
import { UsMeSCCPEligibilityReport } from "./UsMeSCCPEligibilityReport";

let report: UsMeSCCPEligibilityReport;

const config = residentsConfigByState.US_ME.incarcerationOpportunities
  .usMeSCCP as OpportunityConfig;

describe("fully eligible, needs to serve half", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      config,
      outputFixture(usMeSccpFixtures.fullyEligibleHalfPortion),
    );
  });

  test("headline", () => {
    expect(report.headline).toMatchInlineSnapshot(
      `"First, you could be eligible to apply for the Supervised Community Confinement Program"`,
    );
  });

  test("subheading", () => {
    expect(report.subheading).toMatchInlineSnapshot(`""`);
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      [
        {
          "label": "Requirements you've met",
          "requirements": [
            {
              "criterion": "Served 1/2 of your sentence",
            },
            {
              "criterion": "Fewer than 30 months remaining on your sentence",
            },
            {
              "criterion": "No Class A or B discipline in past 90 days",
            },
            {
              "criterion": "Current custody level is Community",
            },
            {
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
          ],
        },
        {
          "label": "Check with your case manager to see if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan for supporting yourself – getting a job, going to school, or receiving Social Security or disability benefits",
            },
            {
              "criterion": "Completed required programs, following your case plan, and showing positive change",
            },
          ],
        },
      ]
    `);
  });
});

describe("eligible to apply before X portion served", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      config,
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
      `"You could be eligible for release onto SCCP on February 16, 2022. You can apply up to 3 months prior to that date — which means that you may be eligible to apply now."`,
    );
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      [
        {
          "label": "Requirements you've met",
          "requirements": [
            {
              "criterion": "Fewer than 30 months remaining on your sentence",
            },
            {
              "criterion": "No Class A or B discipline in past 90 days",
            },
            {
              "criterion": "Current custody level is Minimum",
            },
            {
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
          ],
        },
        {
          "label": "Requirements you haven't met yet",
          "requirements": [
            {
              "criterion": "Served 2/3 of your sentence",
              "ineligibleReason": "You'll meet this requirement on February 16, 2022",
            },
          ],
        },
        {
          "label": "Check with your case manager to see if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan for supporting yourself – getting a job, going to school, or receiving Social Security or disability benefits",
            },
            {
              "criterion": "Completed required programs, following your case plan, and showing positive change",
            },
          ],
        },
      ]
    `);
  });
});

describe("eligible to apply before X months remaining", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      config,
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
      `"You could be eligible for release onto SCCP on February 16, 2022. You can apply up to 3 months prior to that date — which means that you may be eligible to apply now."`,
    );
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      [
        {
          "label": "Requirements you've met",
          "requirements": [
            {
              "criterion": "Served 2/3 of your sentence",
            },
            {
              "criterion": "No Class A or B discipline in past 90 days",
            },
            {
              "criterion": "Current custody level is Minimum",
            },
            {
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
          ],
        },
        {
          "label": "Requirements you haven't met yet",
          "requirements": [
            {
              "criterion": "Fewer than 30 months remaining on your sentence",
              "ineligibleReason": "You'll meet this requirement on February 16, 2022",
            },
          ],
        },
        {
          "label": "Check with your case manager to see if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan for supporting yourself – getting a job, going to school, or receiving Social Security or disability benefits",
            },
            {
              "criterion": "Completed required programs, following your case plan, and showing positive change",
            },
          ],
        },
      ]
    `);
  });
});

describe("almost eligible, portion served", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      config,
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
      [
        {
          "label": "Requirements you've met",
          "requirements": [
            {
              "criterion": "Fewer than 30 months remaining on your sentence",
            },
            {
              "criterion": "No Class A or B discipline in past 90 days",
            },
            {
              "criterion": "Current custody level is Community",
            },
            {
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
          ],
        },
        {
          "label": "Requirements you haven't met yet",
          "requirements": [
            {
              "criterion": "Served 1/2 of your sentence",
              "ineligibleReason": "You'll meet this requirement on May 16, 2022",
            },
          ],
        },
        {
          "label": "Check with your case manager to see if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan for supporting yourself – getting a job, going to school, or receiving Social Security or disability benefits",
            },
            {
              "criterion": "Completed required programs, following your case plan, and showing positive change",
            },
          ],
        },
      ]
    `);
  });
});

describe("almost eligible, recent violation", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      config,
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
      `"You have remaining requirements. Talk to your case manager to understand if and when you can apply."`,
    );
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      [
        {
          "label": "Requirements you've met",
          "requirements": [
            {
              "criterion": "Served 1/2 of your sentence",
            },
            {
              "criterion": "Fewer than 30 months remaining on your sentence",
            },
            {
              "criterion": "Current custody level is Minimum",
            },
            {
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
          ],
        },
        {
          "label": "Requirements you haven't met yet",
          "requirements": [
            {
              "criterion": "No Class A or B discipline in past 90 days",
              "ineligibleReason": "You'll meet this requirement on March 2, 2022",
            },
          ],
        },
        {
          "label": "Check with your case manager to see if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan for supporting yourself – getting a job, going to school, or receiving Social Security or disability benefits",
            },
            {
              "criterion": "Completed required programs, following your case plan, and showing positive change",
            },
          ],
        },
      ]
    `);
  });
});

describe("almost eligible, pending violation", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      config,
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
      `"You have remaining requirements. Talk to your case manager to understand if and when you can apply."`,
    );
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      [
        {
          "label": "Requirements you've met",
          "requirements": [
            {
              "criterion": "Served 1/2 of your sentence",
            },
            {
              "criterion": "Fewer than 30 months remaining on your sentence",
            },
            {
              "criterion": "Current custody level is Minimum",
            },
            {
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
          ],
        },
        {
          "label": "Requirements you haven't met yet",
          "requirements": [
            {
              "criterion": "No Class A or B discipline in past 90 days",
              "ineligibleReason": "You have a Class B violation: Pending since 2021-09-06",
            },
          ],
        },
        {
          "label": "Check with your case manager to see if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan for supporting yourself – getting a job, going to school, or receiving Social Security or disability benefits",
            },
            {
              "criterion": "Completed required programs, following your case plan, and showing positive change",
            },
          ],
        },
      ]
    `);
  });
});

describe("almost eligible, months remaining", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      config,
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
      [
        {
          "label": "Requirements you've met",
          "requirements": [
            {
              "criterion": "Served 2/3 of your sentence",
            },
            {
              "criterion": "No Class A or B discipline in past 90 days",
            },
            {
              "criterion": "Current custody level is Community",
            },
            {
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
          ],
        },
        {
          "label": "Requirements you haven't met yet",
          "requirements": [
            {
              "criterion": "Fewer than 30 months remaining on your sentence",
              "ineligibleReason": "You'll meet this requirement on May 16, 2022",
            },
          ],
        },
        {
          "label": "Check with your case manager to see if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan for supporting yourself – getting a job, going to school, or receiving Social Security or disability benefits",
            },
            {
              "criterion": "Completed required programs, following your case plan, and showing positive change",
            },
          ],
        },
      ]
    `);
  });
});

describe("not eligible", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      outputFixture(usMeResidents[0]),
      config,
      undefined,
    );
  });

  test("headline", () => {
    expect(report.headline).toMatchInlineSnapshot(
      `"Learn about the Supervised Community Confinement Program"`,
    );
  });

  test("subheading", () => {
    expect(report.subheading).toMatchInlineSnapshot(`""`);
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      [
        {
          "label": "In order to be eligible for SCCP, you must have met the following requirements:",
          "requirements": [
            {
              "criterion": "Served 1/2 of your sentence if your sentence is 5 years or fewer; 
                    served 2/3 of your sentence if your sentence is 5 or more years
      ",
            },
            {
              "criterion": "Fewer than 30 months remaining on your sentence",
            },
            {
              "criterion": "No Class A or B discipline in past 90 days",
            },
            {
              "criterion": "Current custody level is  Minimum or Community
      ",
            },
            {
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan for supporting yourself – getting a job, going to school, or receiving Social Security or disability benefits",
            },
            {
              "criterion": "Completed required programs, following your case plan, and showing positive change",
            },
          ],
        },
      ]
    `);
  });
});
