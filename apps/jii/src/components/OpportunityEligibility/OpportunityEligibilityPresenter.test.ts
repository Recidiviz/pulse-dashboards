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

import { residentsConfigByState } from "../../configs/residentsConfig";
import {
  IncarcerationOpportunityId,
  OpportunityConfig,
} from "../../configs/types";
import { ResidentsStore } from "../../datastores/ResidentsStore";
import { RootStore } from "../../datastores/RootStore";
import { UsMeSCCPEligibilityReport } from "../../models/EligibilityReport/UsMe/UsMeSCCPEligibilityReport";
import { OpportunityEligibilityPresenter } from "./OpportunityEligibilityPresenter";

let residentsStore: ResidentsStore;
let presenter: OpportunityEligibilityPresenter;
const opportunityId: IncarcerationOpportunityId = "usMeSCCP";
const eligibleResident = outputFixture(usMeResidents[0]);
const ineligibleResident = outputFixture(
  usMeResidents[usMeResidents.length - 1],
);
const stateConfig = residentsConfigByState.US_ME;
const opportunityConfig = stateConfig.incarcerationOpportunities[
  opportunityId
] as OpportunityConfig;

beforeEach(() => {
  residentsStore = new ResidentsStore(new RootStore(), stateConfig);
});

describe("eligible resident", () => {
  beforeEach(() => {
    presenter = new OpportunityEligibilityPresenter(
      residentsStore,
      eligibleResident.personExternalId,
      opportunityId,
      opportunityConfig,
      new UsMeSCCPEligibilityReport(
        eligibleResident,
        opportunityConfig,
        outputFixture(usMeSccpFixtures.almostEligibleMonthsRemaining),
      ),
    );
  });

  test("summary content", () => {
    expect(presenter.summaryContent).toMatchSnapshot();
  });

  test("requirements content", () => {
    expect(presenter.requirementsContent).toMatchInlineSnapshot(`
        {
          "heading": "Requirements",
          "linkText": "Get details about each requirement",
          "linkUrl": "/maine/eligibility/sccp/requirements",
          "sections": [
            {
              "icon": "Success",
              "label": "Requirements you **have** met",
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
          ],
        }
      `);
  });

  test("additional sections content", () => {
    expect(presenter.additionalSections).toHaveLength(2);
    expect(presenter.additionalSections).toMatchSnapshot();
  });
});

describe("ineligible resident", () => {
  beforeEach(() => {
    presenter = new OpportunityEligibilityPresenter(
      residentsStore,
      ineligibleResident.personExternalId,
      opportunityId,
      opportunityConfig,
      new UsMeSCCPEligibilityReport(
        ineligibleResident,
        opportunityConfig,
        undefined,
      ),
    );
  });

  test("additional sections content", () => {
    expect(presenter.additionalSections).toHaveLength(1);
    expect(presenter.additionalSections).toMatchSnapshot();
  });
});
