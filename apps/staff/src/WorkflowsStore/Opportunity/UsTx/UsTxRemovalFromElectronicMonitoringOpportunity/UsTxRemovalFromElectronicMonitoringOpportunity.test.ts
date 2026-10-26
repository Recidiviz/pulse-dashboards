// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { configure, runInAction } from "mobx";

import { RootStore } from "../../../../RootStore";
import { Client } from "../../../Client";
import { DocumentSubscription } from "../../../subscriptions";
import { dateToTimestamp } from "../../../utils";
import { ineligibleClientRecord } from "../../__fixtures__";
import { UsTxRemovalFromElectronicMonitoringOpportunity } from "./UsTxRemovalFromElectronicMonitoringOpportunity";

vi.mock("../../../subscriptions");

function createTestUnit(recordOverrides = {}) {
  const root = new RootStore();
  root.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  const client = new Client(
    { ...ineligibleClientRecord, stateCode: "US_TX" },
    root,
  );
  const record = {
    stateCode: "US_TX",
    externalId: "em-001",
    eligibleCriteria: {},
    ineligibleCriteria: {},
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: false,
    metadata: {},
    ...recordOverrides,
  };
  const opp = new UsTxRemovalFromElectronicMonitoringOpportunity(
    client,
    record,
  );
  const updatesSub: DocumentSubscription<any> = opp.updatesSubscription;
  runInAction(() => {
    updatesSub.hydrationState = { status: "hydrated" };
  });
  return { opp, updatesSub };
}

beforeEach(() => {
  configure({ safeDescriptors: false });
});

afterEach(() => {
  vi.resetAllMocks();
  configure({ safeDescriptors: true });
});

describe("tabTitle", () => {
  test("returns Ready for Review when eligible and the config has a Ready for Review tab", () => {
    const { opp } = createTestUnit();
    vi.spyOn(opp, "config", "get").mockReturnValue({
      tabGroups: {
        "ELIGIBILITY STATUS": ["Ready for Review", "Almost Eligible"],
      },
    } as any);
    expect(opp.tabTitle()).toBe("Ready for Review");
  });

  test("returns Eligible Now when eligible and the config has no Ready for Review tab", () => {
    const { opp } = createTestUnit();
    vi.spyOn(opp, "config", "get").mockReturnValue({
      tabGroups: {
        "ELIGIBILITY STATUS": ["Eligible Now", "Almost Eligible"],
      },
    } as any);
    expect(opp.tabTitle()).toBe("Eligible Now");
  });

  test("returns Almost Eligible when almost eligible", () => {
    const { opp } = createTestUnit({
      isEligible: false,
      isAlmostEligible: true,
    });
    expect(opp.tabTitle()).toBe("Almost Eligible");
  });

  test("returns Marked Ineligible when denied", () => {
    const { opp, updatesSub } = createTestUnit();
    runInAction(() => {
      updatesSub.data = {
        denial: {
          reasons: ["DISCRETION"],
          updated: {
            by: "officer@tx.gov",
            date: dateToTimestamp("2026-01-01"),
          },
        },
      };
    });
    expect(opp.tabTitle()).toBe("Marked Ineligible");
  });
});

describe("caseNoteHeaders", () => {
  test("lists employment before programs in progress before completed programs", () => {
    const { opp } = createTestUnit();
    expect(opp.caseNoteHeaders).toEqual([
      "Current Employment",
      "Programs in Progress",
      "Completed Programs",
    ]);
  });
});
