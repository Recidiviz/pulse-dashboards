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
  type1: {
    label: "Opportunity Type 1",
    initialHeader: "Initial Header for Opportunity Type 1",
  },
};

function initPresenter(
  selectedSearchIds: OpportunityCaseloadViewPresenter["selectedSearchIds"] = [],
  hasOpportunities: OpportunityCaseloadViewPresenter["hasOpportunities"] = false,
) {
  workflowsStore = {
    selectedOpportunityType: MOCK_OPPORTUNITY_TYPE,
    workflowsSearchFieldTitle: "find",
    justiceInvolvedPersonTitle: "client",
    searchStore: { selectedSearchIds },
  } as unknown as WorkflowsStore;

  opportunityConfigurationStore = {
    opportunities: MOCK_OPPORTUNITY_CONFIG,
  } as unknown as OpportunityConfigurationStore;

  presenter = new OpportunityCaseloadViewPresenter(
    workflowsStore,
    opportunityConfigurationStore,
    MOCK_OPPORTUNITY_TYPE as OpportunityType,
  );

  vi.spyOn(presenter, "hasOpportunities", "get").mockReturnValue(
    hasOpportunities,
  );
}

beforeEach(() => {
  initPresenter();
});

describe("when producing the cta and header text", () => {
  it("returns the selected opportunity type from workflowsStore", () => {
    expect(presenter.opportunityType).toBe(MOCK_OPPORTUNITY_TYPE);
  });

  it("returns the opportunity configuration based on the selected opportunity type", () => {
    // Accessing private property `opportunityConfiguration` via @ts-ignore for testing
    // @ts-ignore
    expect(presenter.opportunityConfiguration).toEqual(
      MOCK_OPPORTUNITY_CONFIG[MOCK_OPPORTUNITY_TYPE],
    );
  });

  describe("OpportunityCaseloadViewPresenter - ctaTextAndHeaderText", () => {
    it("returns ctaText with default header when no IDs are selected", () => {
      const result = presenter.ctaTextAndHeaderText;

      expect(result).toEqual({
        headerText: MOCK_OPPORTUNITY_CONFIG.type1.label,
        ctaText: "Initial Header for Opportunity Type 1",
      });

      expect(result).toMatchInlineSnapshot(`
        {
          "ctaText": "Initial Header for Opportunity Type 1",
          "headerText": "Opportunity Type 1",
        }
      `);
    });

    it("returns message when no eligible opportunities are available for selected IDs", () => {
      initPresenter(["one", "two"], false);

      const result = presenter.ctaTextAndHeaderText;
      expect(result.ctaText).toContain("None of the");
      expect(result.ctaText).toContain("are eligible for opportunity type 1");
    });

    it("returns only headerText when there are eligible opportunities", () => {
      initPresenter(["one"], true);

      const result = presenter.ctaTextAndHeaderText;

      expect(result).toEqual({
        headerText: MOCK_OPPORTUNITY_CONFIG.type1.label,
      });
      expect(result).toMatchInlineSnapshot(`
        {
          "headerText": "Opportunity Type 1",
        }
      `);
    });
  });
});
