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

import { configure } from "mobx";

import { OpportunityType } from "~datatypes";
import {
  isHydrated,
  unpackAggregatedErrors,
} from "~hydration-utils";

import { RootStore } from "../../../RootStore";
import { mockIneligibleClient } from "../../__fixtures__";
import { Client } from "../../Client";
import { LSUOpportunity } from "../../Opportunity";
import { LSUReferralRecordFixture } from "../../Opportunity/UsId/__fixtures__";
import { Resident } from "../../Resident";
import { JusticeInvolvedPerson } from "../../types";
import { OpportunitiesAccordionPresenter } from "../OpportunitiesAccordionPresenter";

let rootStore: RootStore;
let person: JusticeInvolvedPerson;
let opportunity: LSUOpportunity;
let presenter: OpportunitiesAccordionPresenter<any>;

beforeEach(() => {
  configure({ safeDescriptors: false });
  vi.restoreAllMocks();
  vi.resetAllMocks();
  rootStore = new RootStore();
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

function setTestEnabledOppTypes(oppTypes: OpportunityType[]) {
  vi.spyOn(
    rootStore.workflowsRootStore.opportunityConfigurationStore,
    "enabledOpportunityTypes",
    "get",
  ).mockReturnValue(oppTypes);
}

function initializePresenter() {
  const client = new Client(
    {
      ...mockIneligibleClient,
      allEligibleOpportunities: ["LSU"],
    },
    rootStore,
  );

  rootStore.tenantStore.currentTenantId = "US_ID";
  rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  opportunity = new LSUOpportunity(client, LSUReferralRecordFixture);

  presenter = new OpportunitiesAccordionPresenter(
    rootStore.workflowsStore,
    client as unknown as Resident & Client,
    false,
    false,
  );

  person = presenter.person;
}

describe("OpportunitiesAccordionPresenter eligible and almost eligible opportunities", () => {
  it("should be hydrated initially", () => {
    initializePresenter();
    setTestEnabledOppTypes(["LSU"]);
    expect(isHydrated(presenter)).toBeTrue();
  });

  test("successful hydration", async () => {
    initializePresenter();
    setTestEnabledOppTypes(["LSU"]);
    rootStore.tenantStore.currentTenantId = "US_ID";

    vi.spyOn(
      person.opportunityManager,
      "hydrationState",
      "get",
    ).mockReturnValue({ status: "hydrated" });

    vi.spyOn(person.opportunityManager, "opportunities", "get").mockReturnValue(
      {
        LSU: [opportunity],
      },
    );

    await presenter.hydrate();
    expect(isHydrated(presenter)).toBeTrue();

    expect(presenter.opportunitiesToDisplayInAccordion.length).toEqual(1);
    expect(presenter.opportunitiesToDisplayInAccordion[0].type).toEqual("LSU");
  });

  test("failed hydration", async () => {
    initializePresenter();

    vi.spyOn(
      person.opportunityManager,
      "hydrationState",
      "get",
    ).mockReturnValue({ status: "failed" , error: new AggregateError(["Hydration failed"]) });

    vi.spyOn(person.opportunityManager, "opportunities", "get").mockReturnValue(
      {},
    );

    await presenter.hydrate();

    expect(presenter.opportunitiesToDisplayInAccordion).toBeEmpty();
    expect(isHydrated(presenter)).toBeFalse();
    expect(unpackAggregatedErrors(presenter)).toMatchInlineSnapshot(`
      [
        "Hydration failed",
      ]
    `);
  });
});
