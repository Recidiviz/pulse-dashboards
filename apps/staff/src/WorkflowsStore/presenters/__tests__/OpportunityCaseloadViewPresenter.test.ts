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

import { OpportunityType } from "~datatypes";

import { OpportunityConfigurationStore } from "../../Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { WorkflowsStore } from "../../WorkflowsStore";
import { OpportunityCaseloadViewPresenter } from "../OpportunityCaseloadViewPresenter";

let workflowsStore: WorkflowsStore;
let opportunityConfigurationStore: OpportunityConfigurationStore;
let presenter: OpportunityCaseloadViewPresenter;

const MOCK_OPPORTUNITY_TYPE = "type1";
const MOCK_OPPORTUNITY_CONFIG = {
  type1: { label: "Opportunity Type 1" },
};

beforeEach(() => {
  workflowsStore = {
    selectedOpportunityType: MOCK_OPPORTUNITY_TYPE,
  } as unknown as WorkflowsStore;

  opportunityConfigurationStore = {
    opportunities: MOCK_OPPORTUNITY_CONFIG,
  } as unknown as OpportunityConfigurationStore;

  presenter = new OpportunityCaseloadViewPresenter(
    workflowsStore,
    opportunityConfigurationStore,
    MOCK_OPPORTUNITY_TYPE as OpportunityType,
  );
});

describe("the page's opportunity type", () => {
  it("returns the selected opportunity type from workflowsStore", () => {
    expect(presenter.opportunityType).toBe(MOCK_OPPORTUNITY_TYPE);
  });

  it("returns the opportunity configuration based on the selected opportunity type", () => {
    // @ts-expect-error opportunityConfiguration is private
    expect(presenter.opportunityConfiguration).toEqual(
      MOCK_OPPORTUNITY_CONFIG[MOCK_OPPORTUNITY_TYPE],
    );
  });
});

describe("which people the page hydrates", () => {
  /** A person whose manager reports the given incoming types. */
  function personWith(incomingOpportunityTypes: string[]) {
    return {
      opportunityManager: {
        incomingOpportunityTypes,
        hydrationState: { status: "needs hydration" },
        hydrate: vi.fn().mockResolvedValue(undefined),
      },
    };
  }

  function presenterFor(
    persons: ReturnType<typeof personWith>[],
    config: Record<string, unknown> = {},
  ) {
    return new OpportunityCaseloadViewPresenter(
      { caseloadPersons: persons } as unknown as WorkflowsStore,
      {
        opportunities: { type1: config },
      } as unknown as OpportunityConfigurationStore,
      MOCK_OPPORTUNITY_TYPE as OpportunityType,
    );
  }

  it("hydrates only the people the page's type could surface", async () => {
    const surfaced = personWith(["type1", "type2"]);
    const other = personWith(["type2"]);

    await presenterFor([surfaced, other]).populateCaseloads();

    // The surfaced person still loads every type, not just this page's.
    expect(surfaced.opportunityManager.hydrate).toHaveBeenCalledTimes(1);
    expect(other.opportunityManager.hydrate).not.toHaveBeenCalled();
  });

  it("also hydrates the people the linked overdue type could surface", async () => {
    // The list's overdue callout counts that type's eligible opportunities.
    const overdue = personWith(["overdueType"]);

    await presenterFor([overdue], {
      linkedOverdueOpportunityType: "overdueType",
    }).populateCaseloads();

    expect(overdue.opportunityManager.hydrate).toHaveBeenCalledTimes(1);
  });
});
