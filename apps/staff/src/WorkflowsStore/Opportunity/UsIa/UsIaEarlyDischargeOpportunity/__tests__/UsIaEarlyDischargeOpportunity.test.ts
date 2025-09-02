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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Timestamp } from "firebase/firestore";
import { configure } from "mobx";
import timekeeper from "timekeeper";

import { RootStore } from "../../../../../RootStore";
import UserStore from "../../../../../RootStore/UserStore";
import { Client } from "../../../../Client";
import { UsIaSupervisionLevelDowngradeOpportunity } from "../../UsIaSupervisionLevelDowngradeOpportunity";
import {
  usIaEarlyDischargeRecordFixture,
  usIaEdAndSldEligibleClientRecord,
  usIaSupervisionLevelDowngradeRecordFixture,
} from "../../UsIaSupervisionLevelDowngradeOpportunity/__fixtures__";
import {
  PUBLIC_SAFETY_KEY,
  UsIaEarlyDischargeOpportunity,
} from "../UsIaEarlyDischargeOpportunity";

let rootStore: RootStore;

describe("UsIaEarlyDischargeOpportunity clientStatus", () => {
  let opportunity: UsIaEarlyDischargeOpportunity;
  const updateLog = { date: Timestamp.fromDate(new Date()), by: "User" };

  beforeEach(() => {
    configure({ safeDescriptors: false });
    opportunity = Object.create(UsIaEarlyDischargeOpportunity.prototype);
    opportunity.updatesSubscription = {
      data: {},
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      hydrate: vi.fn(),
      hydrationState: { status: "hydrated" },
    };
    // set up a mock configuration for this opportunity
    // @ts-ignore setting a read-only property that is undefined
    opportunity.type = "usIaEarlyDischarge";
    opportunity.rootStore = {
      workflowsRootStore: {
        opportunityConfigurationStore: {
          opportunities: {
            [opportunity.type]: { supportsSubmitted: true },
          },
        },
      },
    } as unknown as RootStore;
  });

  afterEach(() => {
    vi.resetAllMocks();
    configure({ safeDescriptors: true });
  });

  it("returns ELIGIBLE_NOW status by default", () => {
    expect(opportunity.clientStatus).toBe("ELIGIBLE_NOW");
  });

  it("returns DENIED status when denial reasons is present", () => {
    opportunity.updatesSubscription.data!.denial = {
      reasons: ["reason"],
    };
    expect(opportunity.clientStatus).toBe("DENIED");
  });

  it("returns SUBMITTED status when submitted update is present", () => {
    opportunity.updatesSubscription.data!.submitted = updateLog;
    expect(opportunity.clientStatus).toBe("SUBMITTED");
  });

  it("returns DISCHARGE_FORM_REVIEW status for APPROVAL without supervisor response", () => {
    opportunity.updatesSubscription.data!.actionHistory = [
      { type: "APPROVAL", ...updateLog, isStale: false },
    ];
    expect(opportunity.clientStatus).toBe("DISCHARGE_FORM_REVIEW");
  });

  it("returns ACTION_PLAN_REVIEW status for DENIAL with PUBLIC SAFETY reason without supervisor response", () => {
    opportunity.updatesSubscription.data!.actionHistory = [
      {
        type: "DENIAL",
        ...updateLog,
        isStale: false,
        actionPlan: "Action Plan",
        denialReasons: [PUBLIC_SAFETY_KEY],
        requestedSnoozeLength: 30,
      },
    ];
    expect(opportunity.clientStatus).toBe("ACTION_PLAN_REVIEW");
  });

  it("returns READY_FOR_DISCHARGE status for APPROVAL approved by supervisor", () => {
    opportunity.updatesSubscription.data!.actionHistory = [
      {
        type: "APPROVAL",
        supervisorResponse: { type: "APPROVAL", ...updateLog },
        isStale: false,
        ...updateLog,
      },
    ];
    expect(opportunity.clientStatus).toBe("READY_FOR_DISCHARGE");
  });

  it("returns ACTION_PLAN_REVIEW status for APPROVAL denied by supervisor", () => {
    opportunity.updatesSubscription.data!.actionHistory = [
      {
        type: "APPROVAL",
        supervisorResponse: { type: "DENIAL", ...updateLog },
        isStale: false,
        ...updateLog,
      },
    ];
    expect(() => opportunity.clientStatus).toThrow(
      "Expected to be unreachable state. A discharge request was denied without creating a new denial request or action being marked stale.",
    );
  });

  it("returns ACTION_PLAN_REVIEW_REVISION status for DENIAL with supervisor denial", () => {
    opportunity.updatesSubscription.data!.actionHistory = [
      {
        type: "DENIAL",
        supervisorResponse: { type: "DENIAL", ...updateLog },
        ...updateLog,
        isStale: false,
        actionPlan: "Action Plan",
        denialReasons: ["reason"],
        requestedSnoozeLength: 30,
      },
    ];
    expect(opportunity.clientStatus).toBe("ACTION_PLAN_REVIEW_REVISION");
  });

  it("returns ELIGIBLE_NOW status for stale DENIAL with supervisor denial", () => {
    opportunity.updatesSubscription.data!.actionHistory = [
      {
        type: "DENIAL",
        supervisorResponse: { type: "DENIAL", ...updateLog },
        ...updateLog,
        isStale: true,
        actionPlan: "Action Plan",
        denialReasons: ["reason"],
        requestedSnoozeLength: 30,
      },
    ];
    expect(opportunity.clientStatus).toBe("ELIGIBLE_NOW");
  });

  it("returns ELIGIBLE_NOW status for stale DENIAL without supervisor response", () => {
    opportunity.updatesSubscription.data!.actionHistory = [
      {
        type: "DENIAL",
        ...updateLog,
        isStale: true,
        actionPlan: "Action Plan",
        denialReasons: ["reason"],
        requestedSnoozeLength: 30,
      },
    ];
    expect(opportunity.clientStatus).toBe("ELIGIBLE_NOW");
  });

  it("returns ELIGIBLE_NOW status for stale APPROVAL denied by supervisor", () => {
    opportunity.updatesSubscription.data!.actionHistory = [
      {
        type: "APPROVAL",
        supervisorResponse: { type: "DENIAL", ...updateLog },
        isStale: true,
        ...updateLog,
      },
    ];
    expect(opportunity.clientStatus).toBe("ELIGIBLE_NOW");
  });

  it("returns ELIGIBLE_NOW status for stale APPROVAL without supervisor response", () => {
    opportunity.updatesSubscription.data!.actionHistory = [
      { type: "APPROVAL", ...updateLog, isStale: true },
    ];
    expect(opportunity.clientStatus).toBe("ELIGIBLE_NOW");
  });

  describe("sldRelevantDenialReasons", () => {
    it("sldRelevantDenialReasons returns true for relevant denial reasons", () => {
      opportunity.updatesSubscription.data!.denial = {
        reasons: ["FINES & FEES"],
      };
      expect(opportunity.sldRelevantDenial).toBe(true);
    });

    it("sldRelevantDenialReasons returns true for more than one relevant denial reasons", () => {
      opportunity.updatesSubscription.data!.denial = {
        reasons: ["FINES & FEES", "COURT"],
      };
      expect(opportunity.sldRelevantDenial).toBe(true);
    });

    it("sldRelevantDenialReasons returns false for non-relevant denial reasons", () => {
      opportunity.updatesSubscription.data!.denial = {
        reasons: [PUBLIC_SAFETY_KEY],
      };
      expect(opportunity.sldRelevantDenial).toBe(false);
    });

    it("sldRelevantDenial returns false when there is not a denial", () => {
      opportunity.updatesSubscription.data!.denial = undefined;
      expect(opportunity.sldRelevantDenial).toBe(false);
    });
  });
});

describe("companion opportunity", () => {
  let client: Client;
  let opportunity: UsIaEarlyDischargeOpportunity;
  let sldOpportunity: UsIaSupervisionLevelDowngradeOpportunity;

  beforeEach(() => {
    configure({ safeDescriptors: false });
    rootStore = new RootStore();
    rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
    vi.spyOn(
      rootStore.workflowsStore,
      "opportunityTypes",
      "get",
    ).mockReturnValue(["usIaEarlyDischarge"]);
    client = new Client(usIaEdAndSldEligibleClientRecord, rootStore);
    opportunity = new UsIaEarlyDischargeOpportunity(
      client,
      usIaEarlyDischargeRecordFixture,
    );
    sldOpportunity = new UsIaSupervisionLevelDowngradeOpportunity(
      client,
      usIaSupervisionLevelDowngradeRecordFixture,
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
    configure({ safeDescriptors: true });
  });

  describe("sldCompanionOpportunity", () => {
    it("returns undefined when no companion opportunity exists", () => {
      vi.spyOn(client, "flattenedOpportunities", "get").mockReturnValue([
        opportunity,
      ]);

      expect(opportunity.sldCompanionOpportunity).toBeUndefined();
    });

    it("returns the sld opportunity when it exists", () => {
      vi.spyOn(client, "flattenedOpportunities", "get").mockReturnValue([
        opportunity,
        sldOpportunity,
      ]);

      expect(opportunity.sldCompanionOpportunity).toBe(sldOpportunity);
    });
  });

  describe("bannerInfo", () => {
    beforeEach(() => {
      rootStore = new RootStore();
      rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
      vi.spyOn(
        rootStore.workflowsStore,
        "opportunityTypes",
        "get",
      ).mockReturnValue([
        "usIaEarlyDischarge",
        "usIaCompleteSupervisionLevelDowngrade",
      ]);
    });

    it("returns undefined when no companion opportunity exists", () => {
      vi.spyOn(client, "flattenedOpportunities", "get").mockReturnValue([
        opportunity,
      ]);

      expect(opportunity.bannerInfo).toBeUndefined();
    });

    it("returns the correct banner info when there is a companion sld opp", () => {
      client = new Client(usIaEdAndSldEligibleClientRecord, rootStore);
      opportunity.person = client;
      opportunity.updatesSubscription = {
        data: { denial: { reasons: ["FINES & FEES", "COURT"] } },
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        hydrate: vi.fn(),
        hydrationState: { status: "hydrated" },
      };
      const sldOpportunity = new UsIaSupervisionLevelDowngradeOpportunity(
        client,
        usIaSupervisionLevelDowngradeRecordFixture,
      );

      vi.spyOn(client, "flattenedOpportunities", "get").mockReturnValue([
        opportunity,
        sldOpportunity,
      ]);

      expect(opportunity.bannerInfo).toMatchSnapshot();
    });

    it("returns the correct banner info when there are no reasons (should never be the case, just testing logic)", () => {
      client = new Client(usIaEdAndSldEligibleClientRecord, rootStore);
      opportunity.person = client;
      opportunity.updatesSubscription = {
        data: { denial: { reasons: [] } },
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        hydrate: vi.fn(),
        hydrationState: { status: "hydrated" },
      };
      const sldOpportunity = new UsIaSupervisionLevelDowngradeOpportunity(
        client,
        usIaSupervisionLevelDowngradeRecordFixture,
      );

      vi.spyOn(client, "flattenedOpportunities", "get").mockReturnValue([
        opportunity,
        sldOpportunity,
      ]);

      expect(opportunity.bannerInfo).toBeUndefined();
    });
  });
});

describe("maxManualSnoozeDays", () => {
  let opportunity: UsIaEarlyDischargeOpportunity;
  let client: Client;

  beforeEach(() => {
    opportunity = Object.create(UsIaEarlyDischargeOpportunity.prototype);
    opportunity.updatesSubscription = {
      data: {},
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      hydrate: vi.fn(),
      hydrationState: { status: "hydrated" },
    };
    // set up a mock configuration for this opportunity
    // @ts-ignore setting a read-only property that is undefined
    opportunity.type = "usIaEarlyDischarge";

    opportunity.rootStore = {
      workflowsRootStore: {
        opportunityConfigurationStore: {
          opportunities: {
            [opportunity.type]: { supportsSubmitted: true },
          },
        },
      },
      userStore: {
        activeFeatureVariants: vi.fn() as any,
      } as UserStore,
    } as unknown as RootStore;

    client = Object.create(Client.prototype);
    client.expirationDate = new Date("2024-12-31");

    opportunity.person = client;

    vi.spyOn(
      opportunity.rootStore.userStore,
      "activeFeatureVariants",
      "get",
    ).mockReturnValue({
      indefiniteSnooze: {},
    });

    vi.spyOn(opportunity, "denialReasons", "get").mockReturnValue({
      "TEMPORARY REASON": "Temp reason label",
      COURT: "Court reason triggers indefinite snooze",
      "INTERSTATE (IC-IN)": "IC-IN triggers indefinite snooze",
      "INTERSTATE (IC-OUT)":
        "IC-OUT has a longer max snooze length than normal",
    });
  });

  test("Returns max from config if indefinite snooze reason is not selected", () => {
    vi.spyOn(opportunity, "config", "get").mockReturnValue({
      snooze: {
        maxSnoozeDays: 90,
      },
    } as any);

    expect(
      opportunity.maxManualSnoozeDays(["temporaryReason1", "temporaryReason2"]),
    ).toEqual(90);
  });

  test("Returns undefined if indefinite snooze reason (COURT) is selected", () => {
    vi.spyOn(opportunity, "config", "get").mockReturnValue({
      snooze: {
        maxSnoozeDays: 90,
      },
    } as any);

    expect(
      opportunity.maxManualSnoozeDays(["COURT", "temporaryReason2"]),
    ).toBeUndefined();
  });

  test("Returns undefined if indefinite snooze reason (IC-IN) is selected", () => {
    vi.spyOn(opportunity, "config", "get").mockReturnValue({
      snooze: {
        maxSnoozeDays: 90,
      },
    } as any);

    expect(
      opportunity.maxManualSnoozeDays([
        "INTERSTATE (IC-IN)",
        "temporaryReason2",
      ]),
    ).toBeUndefined();
  });

  test("Returns 365 if extended snooze reason (IC-OUT) is selected", () => {
    vi.spyOn(opportunity, "config", "get").mockReturnValue({
      snooze: {
        maxSnoozeDays: 90,
      },
    } as any);

    expect(
      opportunity.maxManualSnoozeDays([
        "INTERSTATE (IC-OUT)",
        "temporaryReason2",
      ]),
    ).toEqual(365);
  });

  test("Caps snooze length to release date", () => {
    timekeeper.freeze(new Date("2024-12-30")); // client expiration date is 12-31
    vi.spyOn(opportunity, "config", "get").mockReturnValue({
      snooze: {
        maxSnoozeDays: 90,
      },
    } as any);

    expect(opportunity.maxManualSnoozeDays(["temporaryReason2"])).toEqual(1);
  });

  test("Doesn't cap snooze length when release date is in the past", () => {
    timekeeper.freeze(new Date("2025-1-15")); // client expiration date is 12-31
    vi.spyOn(opportunity, "config", "get").mockReturnValue({
      snooze: {
        maxSnoozeDays: 90,
      },
    } as any);

    expect(opportunity.maxManualSnoozeDays(["temporaryReason2"])).toEqual(90);
  });
});
