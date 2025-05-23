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

import { RootStore } from "../../../../../RootStore";
import { UsIaEarlyDischargeOpportunity } from "../UsIaEarlyDischargeOpportunity";

describe("UsIaEarlyDischargeOpportunity clientStatus", () => {
  let opportunity: UsIaEarlyDischargeOpportunity;
  const updateLog = { date: Timestamp.fromDate(new Date()), by: "User" };

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
    } as unknown as RootStore;
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
      { type: "APPROVAL", ...updateLog },
    ];
    expect(opportunity.clientStatus).toBe("DISCHARGE_FORM_REVIEW");
  });

  it("returns ACTION_PLAN_REVIEW status for DENIAL without supervisor response", () => {
    opportunity.updatesSubscription.data!.actionHistory = [
      {
        type: "DENIAL",
        ...updateLog,
        actionPlan: "Action Plan",
        denialReasons: ["reason"],
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
        ...updateLog,
      },
    ];
    expect(opportunity.clientStatus).toBe("ACTION_PLAN_REVIEW");
  });

  it("returns ACTION_PLAN_REVIEW_REVISION status for DENIAL with supervisor denial", () => {
    opportunity.updatesSubscription.data!.actionHistory = [
      {
        type: "DENIAL",
        supervisorResponse: { type: "DENIAL", ...updateLog },
        ...updateLog,
        actionPlan: "Action Plan",
        denialReasons: ["reason"],
        requestedSnoozeLength: 30,
      },
    ];
    expect(opportunity.clientStatus).toBe("ACTION_PLAN_REVIEW_REVISION");
  });
});
