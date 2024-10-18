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

import { DocumentData } from "firebase/firestore";
import { configure } from "mobx";
import tk from "timekeeper";

import { RootStore } from "../../../../RootStore";
import { Client } from "../../../Client";
import { DocumentSubscription } from "../../../subscriptions";
import { UsNdEarlyTerminationOpportunity } from "..";
import {
  usNdEarlyTerminationAlmostEligibleClientRecord,
  usNdEarlyTerminationAlmostEligibleReferralRecord,
  usNdEarlyTerminationEligibleClientRecord,
  usNdEarlyTerminationReferralRecord,
} from "../__fixtures__";

let opp: UsNdEarlyTerminationOpportunity;
let client: Client;
let root: RootStore;
let updatesSub: DocumentSubscription<any>;

vi.mock("../../../subscriptions");

function createTestUnit(
  clientRecord: typeof usNdEarlyTerminationEligibleClientRecord,
  opportunityRecord: DocumentData,
) {
  root = new RootStore();
  root.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  vi.spyOn(root.workflowsStore, "opportunityTypes", "get").mockReturnValue([
    "earlyTermination",
  ]);
  client = new Client(clientRecord, root);

  opp = new UsNdEarlyTerminationOpportunity(client, opportunityRecord);
}

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  tk.freeze(new Date(2022, 7, 1));
});

afterEach(() => {
  vi.resetAllMocks();
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("fully eligible", () => {
  beforeEach(() => {
    createTestUnit(
      usNdEarlyTerminationEligibleClientRecord,
      usNdEarlyTerminationReferralRecord,
    );

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };
  });

  test("requirements almost met", () => {
    expect(opp.requirementsAlmostMet).toEqual([]);
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });
});

describe("almost eligible past discharge date coming up", () => {
  beforeEach(() => {
    createTestUnit(
      usNdEarlyTerminationAlmostEligibleClientRecord,
      usNdEarlyTerminationAlmostEligibleReferralRecord,
    );

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };
  });

  test("requirements almost met", () => {
    expect(opp.requirementsAlmostMet).toMatchSnapshot();
  });

  test("requirements met", () => {
    expect(opp.requirementsMet).toMatchSnapshot();
  });

  test("almost eligible status message", () => {
    expect(opp.almostEligibleStatusMessage).toEqual(
      "Early termination date (as calculated by DOCSTARS) is within 60 days",
    );
  });

  test("almost eligible", () => {
    expect(opp.almostEligible).toBeTrue();
  });
});
