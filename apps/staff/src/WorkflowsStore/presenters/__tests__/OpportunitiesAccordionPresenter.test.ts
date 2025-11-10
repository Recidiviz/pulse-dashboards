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
import { isHydrated, unpackAggregatedErrors } from "~hydration-utils";

import { RootStore } from "../../../RootStore";
import { mockIneligibleClient } from "../../__fixtures__";
import { Client } from "../../Client";
import { LSUOpportunity } from "../../Opportunity";
import { PastFTRDOpportunityBase } from "../../Opportunity/PastFTRDOpportunityBase";
import {
  LSUReferralRecordFixture,
  pastFTRDRecordEligibleFixture,
} from "../../Opportunity/UsId/__fixtures__";
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
  rootStore.tenantStore.currentTenantId = "US_ID";
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

function initializePresenter({
  showIneligibleOpportunities,
  enabledTypes,
  pastFTRDSupportsIneligible = true,
}: {
  showIneligibleOpportunities: boolean;
  enabledTypes: OpportunityType[];
  pastFTRDSupportsIneligible?: boolean;
}) {
  const client = new Client(
    {
      ...mockIneligibleClient,
      allEligibleOpportunities: ["LSU"],
    },
    rootStore,
  );

  rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  const configs =
    rootStore.workflowsRootStore.opportunityConfigurationStore.opportunities;
  rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated({
    ...configs,
    pastFTRD: {
      ...configs.pastFTRD,
      supportsIneligible: pastFTRDSupportsIneligible,
    },
  });
  opportunity = new LSUOpportunity(client, LSUReferralRecordFixture);

  presenter = new OpportunitiesAccordionPresenter(
    rootStore.workflowsStore,
    client,
    false,
    false,
    showIneligibleOpportunities,
  );

  person = presenter.person;

  vi.spyOn(
    rootStore.workflowsRootStore.opportunityConfigurationStore,
    "enabledOpportunityTypes",
    "get",
  ).mockReturnValue(enabledTypes);
}

/**
 * Mocks the hydration state and opportunities for the person.
 * @param param0 - Object containing flags for whether the person has pastFTRD records and LSU records.
 */
function opportunityHydratorsReturn({
  hasPastFTRDRecords,
  hasLSURecords,
}: {
  /**
   * Ineligible case (pastFTRD opportunity)
   */
  hasPastFTRDRecords: boolean;
  /**
   * Eligible and almost eligible case (LSU opportunity)
   */
  hasLSURecords: boolean;
}) {
  vi.spyOn(person.opportunityManager, "hydrationState", "get").mockReturnValue({
    status: "hydrated",
  });

  vi.spyOn(person.opportunityManager, "opportunities", "get").mockReturnValue({
    ...(hasLSURecords ? { LSU: [opportunity] } : {}),
  });

  vi.spyOn(
    rootStore.firestoreStore,
    "getOpportunitiesForJIIAndOpportunityType",
  ).mockResolvedValue(
    hasPastFTRDRecords
      ? [
          {
            ...pastFTRDRecordEligibleFixture,
            almostEligible: false,
            isEligible: false,
          },
        ]
      : [],
  );

  vi.spyOn(
    PastFTRDOpportunityBase.prototype,
    "hydrationState",
    "get",
  ).mockReturnValue({
    status: "hydrated",
  });
}

const testCases = [
  // - Supported ineligible opportunities have supportsIneligible = true in their configuration
  // - Unsupported ineligible opportunities have supportsIneligible = false in their configuration
  // - The presenter.showIneligibleOpportunities flag controls whether ineligible opportunities
  // are shown and hydrated at all.
  {
    description: "does not show supported ineligible opps",
    showIneligibleOpportunities: false,
    enabledTypes: ["LSU"] as OpportunityType[],
    pastFTRDSupportsIneligible: true,
    expectedSuccessTypes: ["LSU"],
  },
  {
    description: "does not show unsupported ineligible opps",
    showIneligibleOpportunities: false,
    enabledTypes: ["LSU"] as OpportunityType[],
    pastFTRDSupportsIneligible: false,
    expectedSuccessTypes: ["LSU"],
  },
  {
    description: "shows supported ineligible opps",
    showIneligibleOpportunities: true,
    enabledTypes: ["LSU", "pastFTRD"] as OpportunityType[],
    pastFTRDSupportsIneligible: true,
    expectedSuccessTypes: ["LSU", "pastFTRD"],
  },
  {
    description: "shows unsupported ineligible opps",
    showIneligibleOpportunities: true,
    enabledTypes: ["LSU", "pastFTRD"] as OpportunityType[],
    pastFTRDSupportsIneligible: false,
    expectedSuccessTypes: ["LSU"],
  },
];

describe.each(testCases)(
  "$description",
  ({
    showIneligibleOpportunities,
    enabledTypes,
    pastFTRDSupportsIneligible,
    expectedSuccessTypes,
  }) => {
    test("initial hydration state", () => {
      initializePresenter({
        showIneligibleOpportunities,
        enabledTypes,
        pastFTRDSupportsIneligible,
      });

      expect(presenter.hydrationState).toMatchSnapshot();
    });

    test("has no opportunities to display when hydration has not started", () => {
      initializePresenter({
        showIneligibleOpportunities,
        enabledTypes,
        pastFTRDSupportsIneligible,
      });

      expect(presenter.opportunitiesToDisplayInAccordion).toBeEmpty();
    });

    test("successful hydration when firebase returns a ineligible (pastFTRD) and eligible record (LSU)", async () => {
      initializePresenter({
        showIneligibleOpportunities,
        enabledTypes,
        pastFTRDSupportsIneligible,
      });

      opportunityHydratorsReturn({
        hasPastFTRDRecords: true,
        hasLSURecords: true,
      });

      await presenter.hydrate();
      expect(isHydrated(presenter)).toBeTrue();

      expect(
        presenter.opportunitiesToDisplayInAccordion.map((opp) => opp.type),
      ).toContainAllValues(expectedSuccessTypes);
    });

    test("successful hydration when firebase returns only an eligible record (LSU)", async () => {
      initializePresenter({
        showIneligibleOpportunities,
        enabledTypes,
        pastFTRDSupportsIneligible,
      });

      opportunityHydratorsReturn({
        hasPastFTRDRecords: false,
        hasLSURecords: true,
      });

      await presenter.hydrate();
      expect(isHydrated(presenter)).toBeTrue();

      expect(
        presenter.opportunitiesToDisplayInAccordion.map((opp) => opp.type),
      ).toContainAllValues(["LSU"]);
    });

    test("successful hydration when firebase only returns an ineligible record (pastFTRD)", async () => {
      initializePresenter({
        showIneligibleOpportunities,
        enabledTypes,
        pastFTRDSupportsIneligible,
      });

      vi.spyOn(
        person.opportunityManager,
        "hydrationState",
        "get",
      ).mockReturnValue({ status: "hydrated" });

      opportunityHydratorsReturn({
        hasPastFTRDRecords: true,
        hasLSURecords: false,
      });

      await presenter.hydrate();
      expect(isHydrated(presenter)).toBeTrue();

      const expectedType =
        pastFTRDSupportsIneligible && showIneligibleOpportunities
          ? ["pastFTRD"]
          : [];

      expect(
        presenter.opportunitiesToDisplayInAccordion.map((opp) => opp.type),
      ).toContainAllValues(expectedType);
    });

    test(`failed presenter when opportunityTypes are missing`, async () => {
      initializePresenter({
        showIneligibleOpportunities,
        enabledTypes,
        pastFTRDSupportsIneligible,
      });

      opportunityHydratorsReturn({
        hasPastFTRDRecords: true,
        hasLSURecords: true,
      });

      vi.spyOn(
        person.opportunityManager,
        "hydrationState",
        "get",
      ).mockReturnValue({
        status: "failed",
        error: new Error("Failed to hydrate opportunity manager"),
      });

      vi.spyOn(
        PastFTRDOpportunityBase.prototype,
        "hydrationState",
        "get",
      ).mockReturnValue({
        status: "failed",
        error: new Error("Failed to hydrate pastFTRD opportunity"),
      });

      await presenter.hydrate();

      expect(presenter.hydrationState.status).toBe("failed");
      expect(unpackAggregatedErrors(presenter)).toMatchSnapshot(
        "expect errors",
      );
    });
  },
);
