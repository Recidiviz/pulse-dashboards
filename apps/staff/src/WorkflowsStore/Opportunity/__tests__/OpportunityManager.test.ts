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

import { configure } from "mobx";

import { isHydrated } from "~hydration-utils";

import FirestoreStore from "../../../FirestoreStore";
import { RootStore } from "../../../RootStore";
import { lsuEligibleClient } from "../../__fixtures__";
import { Client } from "../../Client";
import { JusticeInvolvedPerson } from "../../types";
import { ineligibleClientRecord } from "../__fixtures__";
import { OpportunityBase } from "../OpportunityBase";
import { OpportunityManager } from "../OpportunityManager";
import { OpportunityType } from "../OpportunityType";
import {
  EarnedDischargeReferralRecordFixture,
  LSUReferralRecordFixture,
  pastFTRDRecordEligibleFixture,
} from "../UsId/__fixtures__";

let rootStore: RootStore;
let person: JusticeInvolvedPerson;

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
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

describe("instantiation", () => {
  beforeEach(() => {
    rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  });

  test("ineligible client", () => {
    person = new Client(ineligibleClientRecord, rootStore);
    // @ts-ignore
    expect(person.opportunityManager.activeOpportunityTypes).toBeEmpty();
    expect(person.opportunityManager.opportunities).toBeEmptyObject();
    expect(isHydrated(person.opportunityManager)).toBeTrue();
  });

  describe("LSU eligible client", () => {
    test("LSU is not enabled", () => {
      setTestEnabledOppTypes(["pastFTRD"]);
      person = new Client(lsuEligibleClient, rootStore);
      // @ts-ignore
      expect(person.opportunityManager.activeOpportunityTypes).toBeEmpty();
    });

    test("LSU is only one enabled", () => {
      setTestEnabledOppTypes(["LSU"]);
      person = new Client(lsuEligibleClient, rootStore);
      // @ts-ignore
      expect(person.opportunityManager.activeOpportunityTypes).toEqual(["LSU"]);
    });

    test("LSU is one of multiple enabled", () => {
      setTestEnabledOppTypes(["LSU", "pastFTRD"]);
      person = new Client(lsuEligibleClient, rootStore);
      // @ts-ignore
      expect(person.opportunityManager.activeOpportunityTypes).toEqual(["LSU"]);
    });
  });
});

describe("hydrate", () => {
  describe("single eligible opportunity for person", () => {
    beforeEach(() => {
      setTestEnabledOppTypes(["LSU"]);
      person = new Client(lsuEligibleClient, rootStore);
      rootStore.tenantStore.currentTenantId = "US_ID";
      rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();

      vi.spyOn(
        FirestoreStore.prototype,
        "getOpportunitiesForJIIAndOpportunityType",
      ).mockResolvedValue([
        {
          ...LSUReferralRecordFixture,
        },
      ]);
    });

    test("successful individual opportunity hydration", async () => {
      vi.spyOn(
        OpportunityBase.prototype,
        "hydrationState",
        "get",
      ).mockReturnValue({ status: "hydrated" });

      await person.opportunityManager.hydrate();
      expect(isHydrated(person.opportunityManager)).toBeTrue();
      expect(person.opportunities).not.toBeEmptyObject();
    });

    test("failed individual opportunity hydration", async () => {
      vi.spyOn(
        OpportunityBase.prototype,
        "hydrationState",
        "get",
      ).mockReturnValue({ status: "failed", error: new Error() });

      await person.opportunityManager.hydrate();
      expect(person.opportunityManager.hydrationState.status).toBe("failed");
      expect(person.opportunities).toBeEmptyObject();
    });
  });

  describe("person has multiple eligible opportunities", () => {
    test("activeOpportunityTypes set to only one opportunity", async () => {
      setTestEnabledOppTypes(["LSU", "pastFTRD"]);

      const clientRecord = {
        ...ineligibleClientRecord,
        allEligibleOpportunities: ["LSU", "pastFTRD"] as OpportunityType[],
      };
      person = new Client(clientRecord, rootStore);
      rootStore.tenantStore.currentTenantId = "US_ID";
      rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
      const spy = vi.spyOn(
        OpportunityManager.prototype,
        "instantiateOpportunitiesByType",
      );

      vi.spyOn(
        FirestoreStore.prototype,
        "getOpportunitiesForJIIAndOpportunityType",
      ).mockResolvedValue([
        {
          ...LSUReferralRecordFixture,
        },
      ]);

      vi.spyOn(
        OpportunityBase.prototype,
        "hydrationState",
        "get",
      ).mockReturnValue({ status: "hydrated" });

      person.opportunityManager.setSelectedOpportunityTypes(["LSU"]);
      await person.opportunityManager.hydrate();
      expect(isHydrated(person.opportunityManager)).toBeTrue();
      expect(Object.keys(person.opportunities).length).toEqual(1);
      expect(spy).toHaveBeenCalledOnce();
    });

    test("activeOpportunityTypes set after hydration; instantiate not called again", async () => {
      setTestEnabledOppTypes(["earnedDischarge", "pastFTRD"]);

      const clientRecord = {
        ...ineligibleClientRecord,
        allEligibleOpportunities: [
          "earnedDischarge",
          "pastFTRD",
        ] as OpportunityType[],
      };
      person = new Client(clientRecord, rootStore);
      rootStore.tenantStore.currentTenantId = "US_ID";
      rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
      const spy = vi.spyOn(
        OpportunityManager.prototype,
        "instantiateOpportunitiesByType",
      );

      vi.spyOn(
        FirestoreStore.prototype,
        "getOpportunitiesForJIIAndOpportunityType",
      )
        .mockResolvedValueOnce([
          {
            ...EarnedDischargeReferralRecordFixture,
          },
        ])
        .mockResolvedValueOnce([
          {
            ...pastFTRDRecordEligibleFixture,
          },
        ]);

      vi.spyOn(
        OpportunityBase.prototype,
        "hydrationState",
        "get",
      ).mockReturnValue({
        status: "hydrated",
      });

      await person.opportunityManager.hydrate();
      person.opportunityManager.setSelectedOpportunityTypes([
        "earnedDischarge",
      ]);
      expect(isHydrated(person.opportunityManager)).toBeTrue();
      // We expect that instantiate won't call a third time if earned discharge is already hydrated
      expect(spy).toHaveBeenCalledTimes(2);
      expect(Object.keys(person.opportunityManager.opportunities)).toEqual([
        "earnedDischarge",
      ]);
      expect(isHydrated(person.opportunityManager)).toBeTrue();
    });
  });
});

describe("instantiateOpportunitiesByType", () => {
  test("instantiation failed on bad record type", async () => {
    setTestEnabledOppTypes(["LSU"]);
    person = new Client(lsuEligibleClient, rootStore);
    rootStore.tenantStore.currentTenantId = "US_ID";
    rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();

    const { formInformation } = LSUReferralRecordFixture;

    const malformedRecord = {
      ...LSUReferralRecordFixture,
      formInformation: {
        ...formInformation,
        // chargeDescriptions should be an array of strings
        chargeDescriptions: "string",
      },
    };
    vi.spyOn(
      FirestoreStore.prototype,
      "getOpportunitiesForJIIAndOpportunityType",
    ).mockResolvedValue([malformedRecord]);

    await person.opportunityManager.hydrate();
    expect(person.opportunityManager.opportunities).toBeEmptyObject();
    expect(isHydrated(person.opportunityManager)).toBeTrue();
  });
});