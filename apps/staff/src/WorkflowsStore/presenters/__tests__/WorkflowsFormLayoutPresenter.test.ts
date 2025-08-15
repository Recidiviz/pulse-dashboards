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

import { waitFor } from "@testing-library/react";

import { ClientRecord, fieldToDate, OpportunityType } from "~datatypes";
import { isHydrated } from "~hydration-utils";

import FirestoreStore from "../../../FirestoreStore";
import { RootStore } from "../../../RootStore"
import TenantStore from "../../../RootStore/TenantStore";
import { mockIneligibleClient } from "../../__fixtures__";
import { Client } from "../../Client";
import { isEligibleOrAlmostEligible } from "../../Opportunity";
import { OpportunityBase } from "../../Opportunity/OpportunityBase";
import { UsTnCustodyLevelDowngradeReferralRecordFixture, UsTnExpirationReferralRecordFixture } from "../../Opportunity/UsTn/__fixtures__";
import { JusticeInvolvedPerson } from "../../types";
import { WorkflowsStore } from "../../WorkflowsStore";
import { WorkflowsFormLayoutPresenter } from "../WorkflowsFormLayoutPresenter";

let presenter: WorkflowsFormLayoutPresenter;
let selectedPerson: JusticeInvolvedPerson;
let rootStore: RootStore;
let workflowsStore: WorkflowsStore;
let firestoreStore: FirestoreStore;
let tenantStore: TenantStore;

// test with usTnExpiration, but works for all oppType
const usTnExpirationType: OpportunityType = "usTnExpiration";
const usTnCustodyDowngradeType: OpportunityType = "usTnCustodyLevelDowngrade";
const mockTenantId = "US_TN";
const usTnClientRecord: ClientRecord = {
  ...mockIneligibleClient,
  allEligibleOpportunities: ["usTnCustodyLevelDowngrade"],
  expirationDate: fieldToDate("2022-02-02"),
};

describe("WorkflowsFormLayoutPresenter", () => {
  beforeEach(async() => {
    vi.resetAllMocks();

    rootStore = new RootStore();
    rootStore.tenantStore.setCurrentTenantId(mockTenantId);
    rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();

    firestoreStore = new FirestoreStore({rootStore: rootStore});

    tenantStore = { currentTenantId: mockTenantId } as TenantStore;

    selectedPerson = new Client(usTnClientRecord, rootStore);
    selectedPerson.opportunityManager.setSelectedOpportunityTypes([usTnCustodyDowngradeType, usTnExpirationType]);

    workflowsStore = {
      selectedPerson: selectedPerson,
      selectedOpportunityType: usTnCustodyDowngradeType,
      featureVariants: {usTnTEPENotesForAll: {}},
      opportunityConfigurationStore: rootStore.workflowsRootStore.opportunityConfigurationStore,
    } as unknown as WorkflowsStore;

    vi.spyOn(
      FirestoreStore.prototype,
      "getOpportunitiesForJIIAndOpportunityType",
    ).mockResolvedValue([
      {
        ...UsTnCustodyLevelDowngradeReferralRecordFixture,
      },
    ]);

    vi.spyOn(
      OpportunityBase.prototype,
      "hydrationState",
      "get",
    ).mockReturnValue({ status: "hydrated" });

    await selectedPerson.opportunityManager.hydrate();
    expect(isHydrated(selectedPerson.opportunityManager)).toBeTrue();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("eligible form generation", () => {
    beforeEach(() => {
      presenter = new WorkflowsFormLayoutPresenter(
        selectedPerson,
        usTnCustodyDowngradeType,
        workflowsStore,
        firestoreStore,
        tenantStore,
      );
    });

    it("correctly identifies eligible person", () => {
      expect(isEligibleOrAlmostEligible(selectedPerson, usTnCustodyDowngradeType)).toBeTrue();
    });

    it("returns correct opportunity from person & type", async() => {
      presenter.hydrate();
      await waitFor(() => {
        expect(isHydrated(presenter)).toBeTrue();
      });

      expect(presenter.selectedOpportunity?.type).toBe(usTnCustodyDowngradeType);
    });
  });

  describe("ineligible form generation", () => {
    beforeEach(() => {
      presenter = new WorkflowsFormLayoutPresenter(
        selectedPerson,
        usTnExpirationType,
        workflowsStore,
        firestoreStore,
        tenantStore,
      );

      vi.spyOn(
        presenter,
        "hydrate"
      );
    });

    it("correctly identifies ineligible person", () => {
      expect(isEligibleOrAlmostEligible(selectedPerson, usTnExpirationType)).not.toBeTrue();
    });

    it("returns correct opportunity from person & type", async() => {
      vi.spyOn(
        FirestoreStore.prototype,
        "getOpportunitiesForJIIAndOpportunityType",
      ).mockResolvedValue([
        {
          ...UsTnExpirationReferralRecordFixture,
        },
      ]);

      presenter.hydrate();
      await waitFor(() => {
        expect(isHydrated(presenter)).toBeTrue();
      });

      expect(presenter.selectedOpportunity?.type).toBe(usTnExpirationType);
    });
  });
});
