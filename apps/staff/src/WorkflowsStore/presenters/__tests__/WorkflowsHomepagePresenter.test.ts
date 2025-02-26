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

import { TenantId } from "../../../RootStore/types";
import { OpportunityConfigurationStore } from "../../Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import { WorkflowsStore } from "../../WorkflowsStore";
import { WorkflowsHomepagePresenter } from "../WorkflowsHomepagePresenter";

let workflowsStore: WorkflowsStore;
let opportunityConfigurationStore: OpportunityConfigurationStore;
let presenter: WorkflowsHomepagePresenter;

const MOCK_OPPORTUNITY_TYPES = ["type1", "type2"];
const MOCK_OPPORTUNITY_CONFIG = {
  type1: { label: "Opportunity Type 1" },
  type2: { label: "Opportunity Type 2" },
};

beforeEach(() => {
  workflowsStore = {
    workflowsSearchFieldTitle: "field title",
    activeSystem: "INCARCERATION",
    rootStore: { currentTenantId: "mockTenant" },
    user: { info: { givenNames: "John Doe" } },
    supportsMultipleSystems: true,
    opportunityTypes: MOCK_OPPORTUNITY_TYPES,
    searchStore: {
      searchTitleOverride: () => "case manager",
      selectedSearchIds: ["id1", "id2"],
    },
  } as unknown as WorkflowsStore;

  opportunityConfigurationStore = {
    opportunities: MOCK_OPPORTUNITY_CONFIG,
  } as unknown as OpportunityConfigurationStore;

  presenter = new WorkflowsHomepagePresenter(
    workflowsStore,
    opportunityConfigurationStore,
  );
});

describe("WorkflowsHomepagePresenter", () => {
  it("returns user's given names from workflowsStore", () => {
    expect(presenter.userGivenNames).toBe("John Doe");
  });

  it("returns labels with super labels, searchResultLabel, and listOfSelectedOpportunitiesText", () => {
    const labels = presenter.labels;

    expect(labels).toMatchObject({
      justiceInvolvedPersonTitle: workflowsStore.justiceInvolvedPersonTitle,
      workflowsSearchFieldTitle: workflowsStore.workflowsSearchFieldTitle,
      searchResultLabel: expect.any(String),
      listOfSelectedOpportunities: "Opportunity Type 1 and Opportunity Type 2",
    });
  });

  it("returns true for supportsMultipleSystems when workflowsStore supports multiple systems", () => {
    expect(presenter.supportsMultipleSystems).toBe(true);
  });

  describe("searchResultLabel tests", () => {
    it("returns pluralized caseload and location when activeSystem is ALL", () => {
      workflowsStore.activeSystem = "ALL";
      workflowsStore.searchStore.searchTitleOverride = () => "location";
      vi.spyOn(
        workflowsStore.rootStore,
        "currentTenantId",
        "get",
      ).mockReturnValue("mockTenant" as TenantId);

      // Accessing private property via @ts-ignore for testing
      // @ts-ignore
      expect(presenter.searchResultLabel).toBe("caseloads and/or locations");
    });
  });
});
