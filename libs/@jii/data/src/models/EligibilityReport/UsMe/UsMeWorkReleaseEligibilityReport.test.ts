// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { usMeResidents, usMeWorkReleaseFixtures } from "~datatypes";

import { OpportunityConfig } from "../../../configs/types";
import { usMeEligibilityConfig } from "../../../configs/US_ME/eligibility/config";
import { UsMeWorkReleaseEligibilityReport } from "./UsMeWorkReleaseEligibilityReport";

let report: UsMeWorkReleaseEligibilityReport;

const config = usMeEligibilityConfig.incarcerationOpportunities
  .usMeWorkRelease as OpportunityConfig;

describe("eligible", () => {
  beforeEach(() => {
    report = new UsMeWorkReleaseEligibilityReport(
      usMeResidents[0],
      config,
      usMeWorkReleaseFixtures.RES001Eligible,
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
              "criterion": "Served at least 30 days at the facility providing the work release program",
            },
            {
              "criterion": "Fewer than three years remaining on sentence",
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
              "criterion": "Completed required programs and following your case plan",
            },
          ],
        },
      ]
    `);
  });
});

describe("almost eligible years remaining", () => {
  beforeEach(() => {
    report = new UsMeWorkReleaseEligibilityReport(
      usMeResidents[8],
      config,
      usMeWorkReleaseFixtures.RES009AlmostEligibleYearsRemaining,
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
              "criterion": "Served at least 30 days at the facility providing the work release program",
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
              "criterion": "Fewer than three years remaining on sentence",
              "ineligibleReason": "You'll meet this requirement on February 16, 2022",
            },
          ],
        },
        {
          "icon": "ArrowCircled",
          "label": "Ask your case manager if you’ve met these requirements",
          "requirements": [
            {
              "criterion": "Completed required programs and following your case plan",
            },
          ],
        },
      ]
    `);
  });
});

describe("almost eligible violation", () => {
  beforeEach(() => {
    report = new UsMeWorkReleaseEligibilityReport(
      usMeResidents[2],
      config,
      usMeWorkReleaseFixtures.RES003AlmostEligibleViolation,
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
              "criterion": "Served at least 30 days at the facility providing the work release program",
            },
            {
              "criterion": "Fewer than three years remaining on sentence",
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
              "criterion": "Completed required programs and following your case plan",
            },
          ],
        },
      ]
    `);
  });
});

describe("ineligible", () => {
  beforeEach(() => {
    report = new UsMeWorkReleaseEligibilityReport(
      usMeResidents[usMeResidents.length - 1],
      config,
      usMeWorkReleaseFixtures.RES999Ineligible,
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
              "criterion": "Current custody level is Minimum",
            },
            {
              "criterion": "Served at least 30 days at the facility providing the work release program",
              "ineligibleReason": "You'll meet this requirement on December 23, 2021",
            },
            {
              "criterion": "Fewer than three years remaining on sentence",
              "ineligibleReason": "You'll meet this requirement on May 16, 2022",
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
              "criterion": "Completed required programs and following your case plan",
            },
          ],
        },
      ]
    `);
  });
});

describe("already granted", () => {
  beforeEach(() => {
    report = new UsMeWorkReleaseEligibilityReport(
      usMeResidents[3],
      config,
      usMeWorkReleaseFixtures.RES004IneligibleCommunity,
    );
  });

  test("status", () => {
    expect(report.status).toMatchInlineSnapshot(`
      {
        "label": "Not available",
        "value": "NA",
      }
    `);
  });
});
