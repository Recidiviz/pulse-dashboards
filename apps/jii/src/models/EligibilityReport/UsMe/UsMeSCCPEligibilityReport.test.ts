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
      usMeResidents[0],
      config,
      outputFixture(usMeSccpFixtures.RES004fullyEligibleHalfPortion),
    );
  });

  test("status", () => {
    expect(report.status).toMatchInlineSnapshot(`
      {
        "label": "May be eligible",
        "value": "ELIGIBLE",
      }
    `);
  });

  test("highlights", () => {
    expect(report.highlights).toMatchInlineSnapshot(`
      [
        {
          "label": "When you may be eligible to **apply**",
          "value": "Now",
        },
        {
          "label": "When you may be eligible for **release**",
          "value": "Now",
        },
      ]
    `);
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      [
        {
          "icon": "Success",
          "label": "Requirements you **have** met",
          "requirements": [
            {
              "criterion": "Current custody level is Community",
            },
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
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
          ],
        },
        {
          "icon": "ArrowCircled",
          "label": "Ask your case manager if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan to support yourself –  a job, school, Social Security, or disability benefits",
            },
            {
              "criterion": "Completing required programs and following your case plan",
            },
          ],
        },
      ]
    `);
  });

  test("all sections enabled", () => {
    expect(report.enabledSections).toEqual(config.sections);
  });
});

describe("eligible to apply before X portion served", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      usMeResidents[0],
      config,
      outputFixture(usMeSccpFixtures.RES002eligibleToApplyBeforeXPortionServed),
    );
  });

  test("status", () => {
    expect(report.status).toMatchInlineSnapshot(`
      {
        "label": "Almost eligible",
        "value": "ALMOST_ELIGIBLE",
      }
    `);
  });

  test("highlights", () => {
    expect(report.highlights).toMatchInlineSnapshot(`
      [
        {
          "label": "When you may be eligible to **apply**",
          "value": "Now",
        },
        {
          "label": "When you may be eligible for **release**",
          "value": "February 16, 2022",
        },
      ]
    `);
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      [
        {
          "icon": "Success",
          "label": "Requirements you **have** met",
          "requirements": [
            {
              "criterion": "Current custody level is Minimum",
            },
            {
              "criterion": "Fewer than 30 months remaining on your sentence",
            },
            {
              "criterion": "No Class A or B discipline in past 90 days",
            },
            {
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
          ],
        },
        {
          "icon": "CloseOutlined",
          "label": "Requirements you **have not** met yet",
          "requirements": [
            {
              "criterion": "Served 2/3 of your sentence",
              "ineligibleReason": "You'll meet this requirement on February 16, 2022",
            },
          ],
        },
        {
          "icon": "ArrowCircled",
          "label": "Ask your case manager if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan to support yourself –  a job, school, Social Security, or disability benefits",
            },
            {
              "criterion": "Completing required programs and following your case plan",
            },
          ],
        },
      ]
    `);
  });

  test("all sections enabled", () => {
    expect(report.enabledSections).toEqual(config.sections);
  });
});

describe("eligible to apply before X months remaining", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      usMeResidents[0],
      config,
      outputFixture(
        usMeSccpFixtures.RES008eligibleToApplyBeforeXMonthsRemaining,
      ),
    );
  });

  test("status", () => {
    expect(report.status).toMatchInlineSnapshot(`
      {
        "label": "Almost eligible",
        "value": "ALMOST_ELIGIBLE",
      }
    `);
  });

  test("highlights", () => {
    expect(report.highlights).toMatchInlineSnapshot(`
      [
        {
          "label": "When you may be eligible to **apply**",
          "value": "Now",
        },
        {
          "label": "When you may be eligible for **release**",
          "value": "February 16, 2022",
        },
      ]
    `);
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      [
        {
          "icon": "Success",
          "label": "Requirements you **have** met",
          "requirements": [
            {
              "criterion": "Current custody level is Minimum",
            },
            {
              "criterion": "Served 2/3 of your sentence",
            },
            {
              "criterion": "No Class A or B discipline in past 90 days",
            },
            {
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
          ],
        },
        {
          "icon": "CloseOutlined",
          "label": "Requirements you **have not** met yet",
          "requirements": [
            {
              "criterion": "Fewer than 30 months remaining on your sentence",
              "ineligibleReason": "You'll meet this requirement on February 16, 2022",
            },
          ],
        },
        {
          "icon": "ArrowCircled",
          "label": "Ask your case manager if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan to support yourself –  a job, school, Social Security, or disability benefits",
            },
            {
              "criterion": "Completing required programs and following your case plan",
            },
          ],
        },
      ]
    `);
  });

  test("all sections enabled", () => {
    expect(report.enabledSections).toEqual(config.sections);
  });
});

describe("almost eligible, portion served", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      usMeResidents[0],
      config,
      outputFixture(usMeSccpFixtures.RES005almostEligibleXPortion),
    );
  });

  test("status", () => {
    expect(report.status).toMatchInlineSnapshot(`
      {
        "label": "Almost eligible",
        "value": "ALMOST_ELIGIBLE",
      }
    `);
  });

  test("highlights", () => {
    expect(report.highlights).toMatchInlineSnapshot(`
      [
        {
          "label": "When you may be eligible to **apply**",
          "value": "February 16, 2022",
        },
        {
          "label": "When you may be eligible for **release**",
          "value": "May 16, 2022",
        },
      ]
    `);
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      [
        {
          "icon": "Success",
          "label": "Requirements you **have** met",
          "requirements": [
            {
              "criterion": "Current custody level is Minimum",
            },
            {
              "criterion": "Fewer than 30 months remaining on your sentence",
            },
            {
              "criterion": "No Class A or B discipline in past 90 days",
            },
            {
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
          ],
        },
        {
          "icon": "CloseOutlined",
          "label": "Requirements you **have not** met yet",
          "requirements": [
            {
              "criterion": "Served 1/2 of your sentence",
              "ineligibleReason": "You'll meet this requirement on May 16, 2022",
            },
          ],
        },
        {
          "icon": "ArrowCircled",
          "label": "Ask your case manager if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan to support yourself –  a job, school, Social Security, or disability benefits",
            },
            {
              "criterion": "Completing required programs and following your case plan",
            },
          ],
        },
      ]
    `);
  });

  test("all sections enabled", () => {
    expect(report.enabledSections).toEqual(config.sections);
  });
});

describe("almost eligible, recent violation", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      usMeResidents[0],
      config,
      outputFixture(usMeSccpFixtures.RES003almostEligibleRecentViolation),
    );
  });

  test("status", () => {
    expect(report.status).toMatchInlineSnapshot(`
      {
        "label": "Almost eligible",
        "value": "ALMOST_ELIGIBLE",
      }
    `);
  });

  test("highlights", () => {
    expect(report.highlights).toMatchInlineSnapshot(`
      [
        {
          "label": "When you may be eligible to **apply**",
          "value": "Now",
        },
        {
          "label": "When you may be eligible for **release**",
          "value": "Now",
        },
      ]
    `);
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      [
        {
          "icon": "Success",
          "label": "Requirements you **have** met",
          "requirements": [
            {
              "criterion": "Current custody level is Minimum",
            },
            {
              "criterion": "Served 1/2 of your sentence",
            },
            {
              "criterion": "Fewer than 30 months remaining on your sentence",
            },
            {
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
          ],
        },
        {
          "icon": "CloseOutlined",
          "label": "Requirements you **have not** met yet",
          "requirements": [
            {
              "criterion": "No Class A or B discipline in past 90 days",
              "ineligibleReason": "You'll meet this requirement on March 2, 2022",
            },
          ],
        },
        {
          "icon": "ArrowCircled",
          "label": "Ask your case manager if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan to support yourself –  a job, school, Social Security, or disability benefits",
            },
            {
              "criterion": "Completing required programs and following your case plan",
            },
          ],
        },
      ]
    `);
  });

  test("all sections enabled", () => {
    expect(report.enabledSections).toEqual(config.sections);
  });
});

describe("almost eligible, pending violation", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      usMeResidents[0],
      config,
      outputFixture(usMeSccpFixtures.RES007almostEligiblePendingViolation),
    );
  });

  test("status", () => {
    expect(report.status).toMatchInlineSnapshot(`
      {
        "label": "Almost eligible",
        "value": "ALMOST_ELIGIBLE",
      }
    `);
  });

  test("highlights", () => {
    expect(report.highlights).toMatchInlineSnapshot(`[]`);
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      [
        {
          "icon": "Success",
          "label": "Requirements you **have** met",
          "requirements": [
            {
              "criterion": "Current custody level is Minimum",
            },
            {
              "criterion": "Served 1/2 of your sentence",
            },
            {
              "criterion": "Fewer than 30 months remaining on your sentence",
            },
            {
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
          ],
        },
        {
          "icon": "CloseOutlined",
          "label": "Requirements you **have not** met yet",
          "requirements": [
            {
              "criterion": "No Class A or B discipline in past 90 days",
              "ineligibleReason": "You have a Class B violation: Pending since September 6, 2021",
            },
          ],
        },
        {
          "icon": "ArrowCircled",
          "label": "Ask your case manager if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan to support yourself –  a job, school, Social Security, or disability benefits",
            },
            {
              "criterion": "Completing required programs and following your case plan",
            },
          ],
        },
      ]
    `);
  });

  test("all sections enabled", () => {
    expect(report.enabledSections).toEqual(config.sections);
  });
});

describe("almost eligible, months remaining", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      usMeResidents[0],
      config,
      outputFixture(usMeSccpFixtures.RES001almostEligibleMonthsRemaining),
    );
  });

  test("status", () => {
    expect(report.status).toMatchInlineSnapshot(`
      {
        "label": "Almost eligible",
        "value": "ALMOST_ELIGIBLE",
      }
    `);
  });

  test("highlights", () => {
    expect(report.highlights).toMatchInlineSnapshot(`
      [
        {
          "label": "When you may be eligible to **apply**",
          "value": "February 16, 2022",
        },
        {
          "label": "When you may be eligible for **release**",
          "value": "May 16, 2022",
        },
      ]
    `);
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      [
        {
          "icon": "Success",
          "label": "Requirements you **have** met",
          "requirements": [
            {
              "criterion": "Current custody level is Community",
            },
            {
              "criterion": "Served 2/3 of your sentence",
            },
            {
              "criterion": "No Class A or B discipline in past 90 days",
            },
            {
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
          ],
        },
        {
          "icon": "CloseOutlined",
          "label": "Requirements you **have not** met yet",
          "requirements": [
            {
              "criterion": "Fewer than 30 months remaining on your sentence",
              "ineligibleReason": "You'll meet this requirement on May 16, 2022",
            },
          ],
        },
        {
          "icon": "ArrowCircled",
          "label": "Ask your case manager if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan to support yourself –  a job, school, Social Security, or disability benefits",
            },
            {
              "criterion": "Completing required programs and following your case plan",
            },
          ],
        },
      ]
    `);
  });

  test("all sections enabled", () => {
    expect(report.enabledSections).toEqual(config.sections);
  });
});

describe("not eligible", () => {
  beforeEach(() => {
    report = new UsMeSCCPEligibilityReport(
      usMeResidents[0],
      config,
      outputFixture(usMeSccpFixtures.RES999Ineligible),
    );
  });

  test("status", () => {
    expect(report.status).toMatchInlineSnapshot(`
      {
        "label": "Not yet eligible",
        "value": "INELIGIBLE",
      }
    `);
  });

  test("highlights", () => {
    expect(report.highlights).toMatchInlineSnapshot(`[]`);
  });

  test("requirements", () => {
    expect(report.requirements).toMatchInlineSnapshot(`
      [
        {
          "icon": "CloseOutlined",
          "label": "Requirements you **have not** met yet",
          "requirements": [
            {
              "criterion": "Current custody level is Medium",
            },
            {
              "criterion": "Served 1/2 of your sentence",
              "ineligibleReason": "You'll meet this requirement on November 16, 2022",
            },
            {
              "criterion": "Fewer than 30 months remaining on your sentence",
              "ineligibleReason": "You'll meet this requirement on November 16, 2022",
            },
            {
              "criterion": "No Class A or B discipline in past 90 days",
              "ineligibleReason": "You have a Class B violation: Pending since September 6, 2021",
            },
            {
              "criterion": "No unresolved detainers, warrants or pending charges",
            },
          ],
        },
        {
          "icon": "ArrowCircled",
          "label": "Ask your case manager if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Have a safe and healthy place to live for the entire time you are on SCCP",
            },
            {
              "criterion": "Have a plan to support yourself –  a job, school, Social Security, or disability benefits",
            },
            {
              "criterion": "Completing required programs and following your case plan",
            },
          ],
        },
      ]
    `);
  });

  test("all sections enabled", () => {
    expect(report.enabledSections).toEqual(config.sections);
  });
});
