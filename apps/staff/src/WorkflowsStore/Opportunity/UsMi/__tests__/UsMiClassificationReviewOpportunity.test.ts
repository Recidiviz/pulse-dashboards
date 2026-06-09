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

import { RootStore } from "../../../../RootStore";
import { Client } from "../../../Client";
import { DocumentSubscription } from "../../../subscriptions";
import { UsMiClassificationReviewOpportunity } from "..";
import { usMiClassificationReviewEligibleClientRecord } from "../__fixtures__";

const usMiClassificationReviewEligibleRecord: DocumentData = {
  stateCode: "US_MI",
  externalId: "cr-eligible-1",
  eligibleCriteria: {
    usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
      supervisionLevel: "MAXIMUM",
      mediumIsLowestSupervisionLevelAllowed: null,
    },
    usMiSixMonthsPastLastClassificationReviewDate: {
      eligibleDate: "2022-12-12",
    },
  },
  ineligibleCriteria: {},
  metadata: { recommendedSupervisionLevel: "MEDIUM" },
  isEligible: true,
  isAlmostEligible: false,
};

const usMiClassificationReviewAlmostEligibleRecord: DocumentData = {
  stateCode: "US_MI",
  externalId: "cr-almost-1",
  eligibleCriteria: {
    usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
      supervisionLevel: "MAXIMUM",
      mediumIsLowestSupervisionLevelAllowed: null,
    },
  },
  ineligibleCriteria: {
    usMiPastInitialClassificationReviewDate: {
      eligibleDate: "2022-12-12",
    },
  },
  metadata: { recommendedSupervisionLevel: "MEDIUM" },
  isEligible: false,
  isAlmostEligible: true,
};

let opp: UsMiClassificationReviewOpportunity;
let client: Client;
let root: RootStore;
let updatesSub: DocumentSubscription<any>;

vi.mock("../../../subscriptions");

function createTestUnit(
  clientRecord: typeof usMiClassificationReviewEligibleClientRecord,
  opportunityRecord: DocumentData,
) {
  root = new RootStore();
  root.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  vi.spyOn(root.workflowsStore, "opportunityTypes", "get").mockReturnValue([
    "usMiClassificationReview",
  ]);
  client = new Client(clientRecord, root);

  opp = new UsMiClassificationReviewOpportunity(client, opportunityRecord);
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
      usMiClassificationReviewEligibleClientRecord,
      usMiClassificationReviewEligibleRecord,
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
      usMiClassificationReviewEligibleClientRecord,
      usMiClassificationReviewAlmostEligibleRecord,
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
