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
import { Resident } from "../../../Resident";
import { DocumentSubscription } from "../../../subscriptions";
import {
  UsTnCustodyLevelDowngradeEligibleResidentRecord,
  UsTnCustodyLevelDowngradeReferralRecordFixture,
} from "../__fixtures__";
import { UsTnCustodyLevelDowngradeOpportunity } from "../UsTnCustodyLevelDowngradeOpportunity";

vi.mock("../../../subscriptions");

let opp: UsTnCustodyLevelDowngradeOpportunity;
let resident: Resident;
let root: RootStore;
let updatesSub: DocumentSubscription<any>;

function createTestUnit(
  residentRecord: typeof UsTnCustodyLevelDowngradeEligibleResidentRecord,
  opportunityRecord: DocumentData,
) {
  root = new RootStore();
  root.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  vi.spyOn(root.workflowsStore, "opportunityTypes", "get").mockReturnValue([
    "usTnCustodyLevelDowngrade",
  ]);
  resident = new Resident(residentRecord, root);

  opp = new UsTnCustodyLevelDowngradeOpportunity(resident, opportunityRecord);
}

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  tk.freeze(new Date(2024, 7, 1));
});

afterEach(() => {
  vi.resetAllMocks();
  tk.reset();
  configure({ safeDescriptors: true });
});

describe("fully eligible resident", () => {
  beforeEach(() => {
    createTestUnit(
      UsTnCustodyLevelDowngradeEligibleResidentRecord,
      UsTnCustodyLevelDowngradeReferralRecordFixture,
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
