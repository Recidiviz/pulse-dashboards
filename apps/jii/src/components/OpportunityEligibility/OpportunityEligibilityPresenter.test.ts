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
import { waitFor } from "@testing-library/react";
import { set } from "mobx";

import { outputFixture, usMeResidents, usMeSccpFixtures } from "~datatypes";

import { residentsConfigByState } from "../../configs/residentsConfig";
import { IncarcerationOpportunityId } from "../../configs/types";
import { ResidentsStore } from "../../datastores/ResidentsStore";
import { RootStore } from "../../datastores/RootStore";
import { UsMeSCCPEligibilityReport } from "../../models/EligibilityReport/UsMe/UsMeSCCPEligibilityReport";
import { OpportunityEligibilityPresenter } from "./OpportunityEligibilityPresenter";

let residentsStore: ResidentsStore;
let presenter: OpportunityEligibilityPresenter;
const opportunityId: IncarcerationOpportunityId = "usMeSCCP";
const resident = outputFixture(usMeResidents[0]);
const stateConfig = residentsConfigByState.US_ME;
const oppConfig = stateConfig.incarcerationOpportunities[opportunityId];

beforeEach(() => {
  residentsStore = new ResidentsStore(new RootStore(), stateConfig);
  presenter = new OpportunityEligibilityPresenter(
    residentsStore,
    resident.personExternalId,
    opportunityId,
    oppConfig,
  );
});

describe("hydration", () => {
  test("needs hydration", () => {
    expect(presenter.hydrationState.status).toBe("needs hydration");
  });

  test("already hydrated", () => {
    set(
      residentsStore.residentsByExternalId,
      resident.personExternalId,
      resident,
    );
    set(
      residentsStore.residentOpportunityRecordsByExternalId,
      resident.personExternalId,
      {
        [opportunityId]: outputFixture(
          usMeSccpFixtures.fullyEligibleHalfPortion,
        ),
      },
    );
    set(
      residentsStore.residentEligibilityReportsByExternalId,
      resident.personExternalId,
      new Map([
        [
          opportunityId,
          new UsMeSCCPEligibilityReport(
            resident,
            oppConfig,
            outputFixture(usMeSccpFixtures.fullyEligibleHalfPortion),
          ),
        ],
      ]),
    );

    expect(presenter.hydrationState.status).toBe("hydrated");
  });

  test("hydrate", async () => {
    expect(presenter.hydrationState.status).toBe("needs hydration");

    presenter.hydrate();

    expect(presenter.hydrationState.status).toBe("loading");

    await waitFor(() =>
      expect(presenter.hydrationState.status).toBe("hydrated"),
    );
  });
});

test("about content", () => {
  expect(presenter.aboutContent).toMatchSnapshot();
});

describe("after hydration", () => {
  beforeEach(async () => {
    await presenter.hydrate();
  });

  test("requirements content", () => {
    expect(presenter.requirementsContent).toMatchInlineSnapshot(`
      {
        "linkText": "Get details about each requirement",
        "linkUrl": "/eligibility/sccp/requirements",
        "sections": [
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
        ],
      }
    `);
  });

  test("next steps content", () => {
    expect(presenter.nextStepsContent).toMatchSnapshot();
  });
});
