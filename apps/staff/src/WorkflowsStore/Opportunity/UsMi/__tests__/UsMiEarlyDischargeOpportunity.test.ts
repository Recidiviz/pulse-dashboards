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

import { DocumentData } from "firebase/firestore";
import { configure } from "mobx";

import { ClientRecord } from "~datatypes";

import { RootStore } from "../../../../RootStore";
import { Client } from "../../../Client";
import { DocumentSubscription } from "../../../subscriptions";
import { UsMiEarlyDischargeOpportunity } from "..";

const usMiEarlyDischargeEligibleClientRecord: ClientRecord = {
  recordId: "us_mi_ed_001",
  personName: { givenNames: "ALICE", surname: "SMITH" },
  personExternalId: "ed-001",
  displayId: "ded-001",
  pseudonymizedId: "ped-001",
  stateCode: "US_MI",
  officerId: "OFFICER1",
  supervisionType: "PAROLE",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: new Date("2021-01-01"),
  allEligibleOpportunities: ["usMiEarlyDischarge"],
  personType: "CLIENT",
};

const usMiEarlyDischargeEligibleRecord: DocumentData = {
  stateCode: "US_MI",
  externalId: "ed-001",
  eligibleCriteria: {
    supervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate: null,
    servingAtLeastOneYearOnParoleSupervisionOrSupervisionOutOfState: null,
    usMiNoActivePpo: null,
    usMiNoNewIneligibleOffensesForEarlyDischargeFromSupervision: null,
    usMiNotServingIneligibleOffensesForEarlyDischargeFromParoleDualSupervision:
      null,
    supervisionOrSupervisionOutOfStateLevelIsNotHigh: null,
  },
  ineligibleCriteria: {},
  metadata: {
    supervisionType: "Parole",
    officers: [],
    dockets: [],
  },
  isEligible: true,
  isAlmostEligible: false,
};

const usMiEarlyDischargeAlmostEligibleRecord: DocumentData = {
  stateCode: "US_MI",
  externalId: "ed-002",
  eligibleCriteria: {
    servingAtLeastOneYearOnParoleSupervisionOrSupervisionOutOfState: null,
    usMiNoActivePpo: null,
    usMiNoNewIneligibleOffensesForEarlyDischargeFromSupervision: null,
    usMiNotServingIneligibleOffensesForEarlyDischargeFromParoleDualSupervision:
      null,
    supervisionOrSupervisionOutOfStateLevelIsNotHigh: null,
  },
  ineligibleCriteria: {
    supervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate: {
      eligibleDate: "2025-06-01",
    },
  },
  metadata: {
    supervisionType: "Parole",
    eligibleDate: "2025-06-01",
    officers: [],
    dockets: [],
  },
  isEligible: false,
  isAlmostEligible: true,
};

let opp: UsMiEarlyDischargeOpportunity;
let client: Client;
let root: RootStore;
let updatesSub: DocumentSubscription<any>;

vi.mock("../../../subscriptions");

function createTestUnit(
  clientRecord: typeof usMiEarlyDischargeEligibleClientRecord,
  opportunityRecord: DocumentData,
) {
  root = new RootStore();
  root.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  vi.spyOn(root.workflowsStore, "opportunityTypes", "get").mockReturnValue([
    "usMiEarlyDischarge",
  ]);
  client = new Client(clientRecord, root);

  opp = new UsMiEarlyDischargeOpportunity(client, opportunityRecord);
}

beforeEach(() => {
  configure({ safeDescriptors: false });
});

afterEach(() => {
  vi.resetAllMocks();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    createTestUnit(
      usMiEarlyDischargeEligibleClientRecord,
      usMiEarlyDischargeEligibleRecord,
    );

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };
  });

  test("tabTitle returns Eligible Now", () => {
    expect(opp.tabTitle()).toBe("Eligible Now");
  });

  test("subcategory returns ELIGIBLE_NOW", () => {
    expect(opp.subcategory).toBe("ELIGIBLE_NOW");
  });
});

describe("almost eligible", () => {
  beforeEach(() => {
    createTestUnit(
      usMiEarlyDischargeEligibleClientRecord,
      usMiEarlyDischargeAlmostEligibleRecord,
    );

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };
  });

  test("tabTitle returns Eligible Now", () => {
    expect(opp.tabTitle()).toBe("Eligible Now");
  });

  test("subcategory returns ALMOST_ELIGIBLE", () => {
    expect(opp.subcategory).toBe("ALMOST_ELIGIBLE");
  });
});
