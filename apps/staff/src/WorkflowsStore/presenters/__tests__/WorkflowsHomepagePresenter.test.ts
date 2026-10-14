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
    activeSystem: "INCARCERATION",
    rootStore: {
      currentTenantId: "mockTenant",
      tenantStore: { currentTenantConfig: undefined },
      userStore: { canUserAccessTasks: false },
    },
    user: { info: { givenNames: "John Doe" } },
    supportsMultipleSystems: true,
    opportunityTypes: MOCK_OPPORTUNITY_TYPES,
    // Empty per-system search config keeps searchResultLabel + titleForSystem
    // resolving cleanly to their defaults; individual tests can override.
    systemConfigFor: () => ({ search: [] }),
    searchStore: {
      workflowsSearchFieldTitle: "field title",
      selectedSearchIds: ["id1", "id2"],
      isTypesenseSearchEnabled: true,
      searchTypeOverride: undefined,
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
      workflowsSearchFieldTitle:
        workflowsStore.searchStore.workflowsSearchFieldTitle,
      searchResultLabel: expect.any(String),
      listOfSelectedOpportunities: "Opportunity Type 1 and Opportunity Type 2",
    });
  });

  it("returns true for supportsMultipleSystems when workflowsStore supports multiple systems", () => {
    expect(presenter.supportsMultipleSystems).toBe(true);
  });

  describe("searchResultLabel tests", () => {
    it("returns pluralized caseload and location when activeSystem is ALL", () => {
      const ws = workflowsStore as any;
      ws.activeSystem = "ALL";
      // INCARCERATION resolves to "location" (single search config); no pill
      // override is set, so the ALL-mode branch fires "caseloads and/or locations".
      ws.systemConfigFor = (system: "SUPERVISION" | "INCARCERATION") =>
        system === "INCARCERATION"
          ? { search: [{ searchType: "FACILITY", searchTitle: "location" }] }
          : { search: [] };
      ws.searchStore.searchTypeOverride = undefined;
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

  describe("ctaAndHeaderText", () => {
    const NO_RESULTS =
      "None of the selected caseloads have eligible opportunities. Search for another caseload.";
    const FOUND_ITEMS =
      "Hi, John Doe. We’ve found some outstanding items across 2 caseloads";

    function oppInTab(
      tab: string,
      tabGroups = { ELIGIBILITY_STATUS: ["Eligible Now", "Marked Ineligible"] },
    ) {
      return { tabTitle: () => tab, config: { tabGroups } };
    }

    function setOpportunities(opportunitiesByType: Record<string, unknown[]>) {
      const ws = workflowsStore as any;
      ws.searchStore.isTypesenseSearchEnabled = false;
      ws.allOpportunitiesByType = opportunitiesByType;
    }

    it("shows found items for eligible opportunities", () => {
      setOpportunities({ type1: [oppInTab("Eligible Now")], type2: [] });
      expect(presenter.ctaAndHeaderText.headerText).toBe(FOUND_ITEMS);
    });

    it("shows found items for denied opportunities", () => {
      setOpportunities({ type1: [oppInTab("Marked Ineligible")], type2: [] });
      expect(presenter.ctaAndHeaderText.headerText).toBe(FOUND_ITEMS);
    });

    it("shows no results for ineligible opportunities", () => {
      setOpportunities({
        type1: [oppInTab("Not Currently Eligible")],
        type2: [],
      });
      expect(presenter.ctaAndHeaderText).toEqual({ ctaText: NO_RESULTS });
    });

    it("shows found items for ineligible opportunities when that tab is configured", () => {
      setOpportunities({
        type1: [
          oppInTab("Not Currently Eligible", {
            ELIGIBILITY_STATUS: ["Eligible Now", "Not Currently Eligible"],
          }),
        ],
        type2: [],
      });
      expect(presenter.ctaAndHeaderText.headerText).toBe(FOUND_ITEMS);
    });

    it("shows no results without opportunities", () => {
      setOpportunities({ type1: [], type2: [] });
      expect(presenter.ctaAndHeaderText).toEqual({ ctaText: NO_RESULTS });
    });

    it("shows only the page title for results when the FV is on", () => {
      setOpportunities({ type1: [oppInTab("Eligible Now")], type2: [] });
      (workflowsStore as any).searchStore.isTypesenseSearchEnabled = true;
      expect(presenter.ctaAndHeaderText).toEqual({
        headerText: "Opportunities",
      });
    });

    it("shows the page title over no results when the FV is on", () => {
      setOpportunities({ type1: [], type2: [] });
      (workflowsStore as any).searchStore.isTypesenseSearchEnabled = true;
      expect(presenter.ctaAndHeaderText).toEqual({
        headerText: "Opportunities",
        ctaText: NO_RESULTS,
      });
    });
  });

  describe("ctaAndHeaderText — no-search welcome message", () => {
    function noSearchSelectedWith({
      typesenseEnabled,
    }: {
      typesenseEnabled: boolean;
    }) {
      const ws = workflowsStore as any;
      ws.searchStore.selectedSearchIds = [];
      ws.searchStore.isTypesenseSearchEnabled = typesenseEnabled;
    }

    it.each([
      ["SUPERVISION", "Search for someone's caseload to see the people on it."],
      ["INCARCERATION", "Search a facility to see the people in it."],
      [
        "ALL",
        "Search for someone's caseload or a facility to see the people on it.",
      ],
    ])(
      "names what %s lets the user search when the FV is on",
      (activeSystem, ctaText) => {
        noSearchSelectedWith({ typesenseEnabled: true });
        (workflowsStore as any).activeSystem = activeSystem;
        expect(presenter.ctaAndHeaderText).toEqual({
          headerText: "Find people eligible for opportunities",
          ctaText,
        });
      },
    );

    it("greets the user and lists opportunities when the FV is off", () => {
      noSearchSelectedWith({ typesenseEnabled: false });
      expect(presenter.ctaAndHeaderText).toEqual({
        headerText: "Hi, John Doe.",
        ctaText:
          "Search above to review and refer people eligible for opportunities like Opportunity Type 1 and Opportunity Type 2.",
      });
    });
  });
});
