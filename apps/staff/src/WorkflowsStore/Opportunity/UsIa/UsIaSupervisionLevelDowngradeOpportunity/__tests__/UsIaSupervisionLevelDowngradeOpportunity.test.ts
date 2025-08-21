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

import { RootStore } from "../../../../../RootStore";
import { Client } from "../../../../Client";
import { OpportunityBase } from "../../../OpportunityBase";
import { UsIaEarlyDischargeOpportunity } from "../../UsIaEarlyDischargeOpportunity";
import {
  usIaEarlyDischargeRecordFixture,
  usIaSupervisionLevelDowngradeEligibleClientRecord,
  usIaSupervisionLevelDowngradeRecordFixture,
} from "../__fixtures__";
import { UsIaSupervisionLevelDowngradeOpportunity } from "../UsIaSupervisionLevelDowngradeOpportunity";

let rootStore: RootStore;

describe("UsIaSupervisionLevelDowngradeOpportunity", () => {
  let sldOpportunity: UsIaSupervisionLevelDowngradeOpportunity;
  let edOpportunity: UsIaEarlyDischargeOpportunity;

  beforeEach(() => {
    configure({ safeDescriptors: false });
    rootStore = new RootStore();
    rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
    vi.spyOn(
      rootStore.workflowsStore,
      "opportunityTypes",
      "get",
    ).mockReturnValue(["usIaSupervisionLevelDowngrade"]);
    const client = new Client(
      usIaSupervisionLevelDowngradeEligibleClientRecord,
      rootStore,
    );
    sldOpportunity = new UsIaSupervisionLevelDowngradeOpportunity(
      client,
      usIaSupervisionLevelDowngradeRecordFixture,
    );
    edOpportunity = new UsIaEarlyDischargeOpportunity(
      client,
      usIaEarlyDischargeRecordFixture,
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
    configure({ safeDescriptors: true });
  });

  describe("earlyDischargeEligibilityCompanionOpportunity", () => {
    it("returns the correct earlyDischargeEligibilityCompanionOpportunity when there is an ED opp", () => {
      vi.spyOn(
        OpportunityBase.prototype,
        "eligibilityCompanionOpportunities",
        "get",
      ).mockReturnValue([edOpportunity]);

      expect(sldOpportunity.earlyDischargeEligibilityCompanionOpportunity).toBe(
        edOpportunity,
      );
    });

    it("throws an error if there are more than one earlyDischargeEligibilityCompanionOpportunity", () => {
      vi.spyOn(
        OpportunityBase.prototype,
        "eligibilityCompanionOpportunities",
        "get",
      ).mockReturnValue([edOpportunity, edOpportunity]);
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        sldOpportunity.earlyDischargeEligibilityCompanionOpportunity;
      } catch (e: any) {
        expect((e as Error).message).toBe(
          "Expected either zero or one companion UsIaEarlyDischargeOpportunity, received multiple.",
        );
      }
    });

    it("returns undefined when there is not an earlyDischargeEligibilityCompanionOpportunity", () => {
      vi.spyOn(
        OpportunityBase.prototype,
        "eligibilityCompanionOpportunities",
        "get",
      ).mockReturnValue([]);

      expect(
        sldOpportunity.earlyDischargeEligibilityCompanionOpportunity,
      ).toBeUndefined();
    });
  });

  describe("pendingEligbility", () => {
    beforeEach(() => {
      vi.spyOn(
        OpportunityBase.prototype,
        "eligibilityCompanionOpportunities",
        "get",
      ).mockReturnValue([edOpportunity]);
    });

    it("returns true when the earlyDischargeEligibilityCompanionOpportunity has a denial with relevant reason", () => {
      edOpportunity.updatesSubscription = {
        data: { denial: { reasons: ["FINES & FEES"] } },
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        hydrate: vi.fn(),
        hydrationState: { status: "hydrated" },
      };
      expect(sldOpportunity.pendingEligibility).toBe(true);
    });

    it("returns false when the earlyDischargeEligibilityCompanionOpportunity does not have a denial", () => {
      edOpportunity.updatesSubscription = {
        data: {},
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        hydrate: vi.fn(),
        hydrationState: { status: "hydrated" },
      };
      expect(sldOpportunity.pendingEligibility).toBe(false);
    });

    it("returns false when the earlyDischargeEligibilityCompanionOpportunity has a denial without relevant reason", () => {
      edOpportunity.updatesSubscription = {
        data: { denial: { reasons: ["OTHER REASON"] } },
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        hydrate: vi.fn(),
        hydrationState: { status: "hydrated" },
      };
      expect(sldOpportunity.pendingEligibility).toBe(false);
    });

    it("returns false when the earlyDischargeEligibilityCompanionOpportunity has a denial with relevant and not-relevant reason", () => {
      edOpportunity.updatesSubscription = {
        data: { denial: { reasons: ["ANY OTHER REASON", "FINES & FEES"] } },
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        hydrate: vi.fn(),
        hydrationState: { status: "hydrated" },
      };
      expect(sldOpportunity.pendingEligibility).toBe(false);
    });

    it("returns true when the earlyDischargeEligibilityCompanionOpportunity has a denial with more than one relevant reason", () => {
      edOpportunity.updatesSubscription = {
        data: { denial: { reasons: ["COURT", "FINES & FEES"] } },
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        hydrate: vi.fn(),
        hydrationState: { status: "hydrated" },
      };
      expect(sldOpportunity.pendingEligibility).toBe(true);
    });
  });
});
