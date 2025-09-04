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

import {
  usMeEligibilityConfig,
  UsMeSCCPEligibilityReport,
  UsMeWorkReleaseEligibilityReport,
} from "~@jii/data";
import {
  outputFixture,
  usMeResidents,
  usMeSccpFixtures,
  usMeWorkReleaseFixtures,
} from "~datatypes";

import { EligibilityPresenter } from "./EligibilityPresenter";

let presenter: EligibilityPresenter;

describe("with NA opportunities", () => {
  beforeEach(() => {
    // this resident should have an associated NA work release opportunity
    const testResident = usMeResidents[3];

    presenter = new EligibilityPresenter(
      [
        {
          opportunityId: "usMeSCCP",
          opportunityConfig:
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeSCCP!,
          eligibilityReport: new UsMeSCCPEligibilityReport(
            testResident,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeSCCP!,
            outputFixture(usMeSccpFixtures.RES004fullyEligibleHalfPortion),
          ),
        },
        {
          opportunityId: "usMeWorkRelease",
          opportunityConfig:
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeWorkRelease!,
          eligibilityReport: new UsMeWorkReleaseEligibilityReport(
            testResident,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeWorkRelease!,
            usMeWorkReleaseFixtures.RES004IneligibleCommunity,
          ),
        },
      ],
      usMeEligibilityConfig,
    );
  });

  test("opportunities are filtered", async () => {
    expect(
      presenter.opportunities.find(
        (data) => data.opportunityId === "usMeWorkRelease",
      ),
    ).toBeUndefined();
    expect(presenter.opportunities.length).toBe(
      Object.keys(usMeEligibilityConfig.incarcerationOpportunities).length - 1,
    );
  });

  test("comparison is excluded", () => {
    expect(presenter.comparison).toBeUndefined();
  });
});

describe("without NA opportunities", () => {
  beforeEach(() => {
    const testResident = usMeResidents[0];

    presenter = new EligibilityPresenter(
      [
        {
          opportunityId: "usMeSCCP",
          opportunityConfig:
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeSCCP!,
          eligibilityReport: new UsMeSCCPEligibilityReport(
            testResident,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeSCCP!,
            outputFixture(usMeSccpFixtures.RES001almostEligibleMonthsRemaining),
          ),
        },
        {
          opportunityId: "usMeWorkRelease",
          opportunityConfig:
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeWorkRelease!,
          eligibilityReport: new UsMeWorkReleaseEligibilityReport(
            testResident,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeWorkRelease!,
            usMeWorkReleaseFixtures.RES001Eligible,
          ),
        },
      ],
      usMeEligibilityConfig,
    );
  });

  test("opportunities are not filtered", () => {
    Object.keys(usMeEligibilityConfig.incarcerationOpportunities).forEach(
      (key) => {
        expect(
          presenter.opportunities.find((d) => d.opportunityId === key),
        ).toBeDefined();
      },
    );
  });

  test("comparison is included", () => {
    expect(presenter.comparison).toBeDefined();
    expect(presenter.comparison).toEqual(
      usMeEligibilityConfig.comparisons?.[0],
    );
  });
});

describe("opportunity sorting", () => {
  test("input order when statuses match", () => {
    const testResident = usMeResidents[5];

    presenter = new EligibilityPresenter(
      [
        {
          opportunityId: "usMeWorkRelease",
          opportunityConfig:
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeWorkRelease!,
          eligibilityReport: new UsMeWorkReleaseEligibilityReport(
            testResident,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeWorkRelease!,
            usMeWorkReleaseFixtures.RES006Eligible,
          ),
        },
        {
          opportunityId: "usMeSCCP",
          opportunityConfig:
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeSCCP!,
          eligibilityReport: new UsMeSCCPEligibilityReport(
            testResident,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeSCCP!,
            outputFixture(usMeSccpFixtures.RES006fullyEligibleTwoThirdsPortion),
          ),
        },
      ],
      usMeEligibilityConfig,
    );

    const { opportunities } = presenter;
    expect(opportunities).toHaveLength(2);
    expect(opportunities[0].opportunityId).toBe("usMeWorkRelease");
    expect(opportunities[0].eligibilityReport.status.value).toBe("ELIGIBLE");

    expect(opportunities[1].opportunityId).toBe("usMeSCCP");
    expect(opportunities[1].eligibilityReport.status.value).toBe("ELIGIBLE");
  });

  test("in status order", () => {
    const testResident = usMeResidents[7];

    presenter = new EligibilityPresenter(
      [
        {
          opportunityId: "usMeSCCP",
          opportunityConfig:
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeSCCP!,
          eligibilityReport: new UsMeSCCPEligibilityReport(
            testResident,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeSCCP!,
            outputFixture(
              usMeSccpFixtures.RES008eligibleToApplyBeforeXMonthsRemaining,
            ),
          ),
        },
        {
          opportunityId: "usMeWorkRelease",
          opportunityConfig:
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeWorkRelease!,
          eligibilityReport: new UsMeWorkReleaseEligibilityReport(
            testResident,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            usMeEligibilityConfig.incarcerationOpportunities.usMeWorkRelease!,
            usMeWorkReleaseFixtures.RES008Ineligible30Days,
          ),
        },
      ],
      usMeEligibilityConfig,
    );

    const { opportunities } = presenter;
    expect(opportunities).toHaveLength(2);
    expect(opportunities[0].opportunityId).toBe("usMeSCCP");
    expect(opportunities[0].eligibilityReport.status.value).toBe(
      "ALMOST_ELIGIBLE",
    );

    expect(opportunities[1].opportunityId).toBe("usMeWorkRelease");
    expect(opportunities[1].eligibilityReport.status.value).toBe("INELIGIBLE");
  });
});
