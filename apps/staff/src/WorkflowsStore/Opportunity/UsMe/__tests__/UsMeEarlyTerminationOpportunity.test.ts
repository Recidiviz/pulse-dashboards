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
import { UsMeEarlyTerminationOpportunity } from "..";
import {
  usMeEarlyTerminationAlmostEligiblePendingViolationClientRecord,
  usMeEarlyTerminationAlmostEligibleRestitutionClientRecord,
  usMeEarlyTerminationEligibleClientRecord,
  usMeEarlyTerminationReferralRecord,
  usMeEarlyTerminationRestitutionAlmostEligibleReferralRecord,
  usMeEarlyTerminationViolationAlmostEligibleReferralRecord,
} from "../__fixtures__";

let opp: UsMeEarlyTerminationOpportunity;
let client: Client;
let root: RootStore;
let updatesSub: DocumentSubscription<any>;

vi.mock("../../../subscriptions");

function createTestUnit(
  clientRecord: typeof usMeEarlyTerminationEligibleClientRecord,
  opportunityRecord: DocumentData,
) {
  root = new RootStore();
  root.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  vi.spyOn(root.workflowsStore, "opportunityTypes", "get").mockReturnValue([
    "usMeEarlyTermination",
  ]);
  client = new Client(clientRecord, root);

  opp = new UsMeEarlyTerminationOpportunity(client, opportunityRecord);
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
      usMeEarlyTerminationEligibleClientRecord,
      usMeEarlyTerminationReferralRecord,
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

describe("almost eligible restitution owed", () => {
  beforeEach(() => {
    createTestUnit(
      usMeEarlyTerminationAlmostEligibleRestitutionClientRecord,
      usMeEarlyTerminationRestitutionAlmostEligibleReferralRecord,
    );

    // referralSub = opp.referralSubscription;
    // referralSub.hydrationState = { status: "hydrated" };
    // referralSub.data =
    //   usMeEarlyTerminationRestitutionAlmostEligibleReferralRecord;

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
      "Remaining Restitution Balance $500.00",
    );
  });

  test("almost eligible", () => {
    expect(opp.almostEligible).toBeTrue();
  });
});

describe("almost eligible pending violation", () => {
  beforeEach(() => {
    createTestUnit(
      usMeEarlyTerminationAlmostEligiblePendingViolationClientRecord,
      usMeEarlyTerminationViolationAlmostEligibleReferralRecord,
    );

    // referralSub = opp.referralSubscription;
    // referralSub.hydrationState = { status: "hydrated" };
    // referralSub.data =
    //   usMeEarlyTerminationViolationAlmostEligibleReferralRecord;

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
      "Violation Pending since Jan 1, 2023",
    );
  });

  test("almost eligible", () => {
    expect(opp.almostEligible).toBeTrue();
  });
});
