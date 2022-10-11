// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { configure, makeObservable, observable, runInAction } from "mobx";

import {
  CombinedUserRecord,
  updateOpportunityFirstViewed,
} from "../../../firestore";
import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import {
  CollectionDocumentSubscription,
  OpportunityUpdateSubscription,
} from "../../subscriptions";
import { ineligibleClientRecord } from "../__fixtures__";
import { OpportunityBase } from "../OpportunityBase";
import {
  COMPLETED_UPDATE,
  DENIED_UPDATE,
  INCOMPLETE_FORM_UPDATE,
  VIEWED_UPDATE,
} from "../testUtils";
import { Opportunity, OpportunityType } from "../types";

jest.mock("../../subscriptions");
jest.mock("../../../firestore");

const CollectionDocumentSubscriptionMock = CollectionDocumentSubscription as jest.MockedClass<
  typeof CollectionDocumentSubscription
>;
const OpportunityUpdateSubscriptionMock = OpportunityUpdateSubscription as jest.MockedClass<
  typeof OpportunityUpdateSubscription
>;
const updateOpportunityFirstViewedMock = updateOpportunityFirstViewed as jest.Mock;

let opp: Opportunity;
let client: Client;
let root: RootStore;
let referralSub: CollectionDocumentSubscription<any>;
let updatesSub: OpportunityUpdateSubscription<any>;
let mockUser: CombinedUserRecord;
let mockUserStateCode: jest.SpyInstance;

class TestOpportunity extends OpportunityBase<Record<string, any>> {}

function createTestUnit() {
  mockUser = {
    info: {
      stateCode: ineligibleClientRecord.stateCode,
      email: "test@email.gov",
      givenNames: "",
      hasCaseload: false,
      id: "abc123",
      surname: "",
    },
  };
  root = new RootStore();
  mockUserStateCode = jest.spyOn(root.userStore, "stateCode", "get");
  // using an ineligible to avoid wasted work creating opportunities we don't need
  client = new Client(ineligibleClientRecord, root);
  opp = new TestOpportunity(client, "TEST" as OpportunityType);
}

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
  };
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  createTestUnit();

  [referralSub] = CollectionDocumentSubscriptionMock.mock.instances;

  [updatesSub] = OpportunityUpdateSubscriptionMock.mock.instances;
});

afterEach(() => {
  process.env = originalEnv;
  jest.resetAllMocks();
  configure({ safeDescriptors: true });
});

describe("hydration is lowest common denominator of all subscriptions", () => {
  test.each([
    [undefined, undefined, undefined],
    [undefined, true, undefined],
    [undefined, false, undefined],
    [true, true, true],
    [true, false, true],
    [false, false, false],
  ])("isLoading: %s + %s = %s", (statusA, statusB, result) => {
    referralSub.isLoading = statusA;
    updatesSub.isLoading = statusB;
    expect(opp.isLoading).toBe(result);

    referralSub.isLoading = statusB;
    updatesSub.isLoading = statusA;
    expect(opp.isLoading).toBe(result);
  });

  test.each([
    [true, true, true],
    [true, false, false],
    [false, false, false],
  ])("isHydrated: %s + %s = %s", (statusA, statusB, result) => {
    referralSub.isHydrated = statusA;
    updatesSub.isHydrated = statusB;
    expect(opp.isHydrated).toBe(result);

    referralSub.isHydrated = statusB;
    updatesSub.isHydrated = statusA;
    expect(opp.isHydrated).toBe(result);
  });
});

test("hydrate", () => {
  opp.hydrate();
  expect(referralSub.hydrate).toHaveBeenCalled();
  expect(updatesSub.hydrate).toHaveBeenCalled();
});

test("review status", () => {
  expect(opp.reviewStatus).toBe("PENDING");

  updatesSub.data = VIEWED_UPDATE;
  expect(opp.reviewStatus).toBe("IN_PROGRESS");

  updatesSub.data = INCOMPLETE_FORM_UPDATE;
  expect(opp.reviewStatus).toBe("IN_PROGRESS");

  updatesSub.data = DENIED_UPDATE;
  expect(opp.reviewStatus).toBe("DENIED");

  updatesSub.data = COMPLETED_UPDATE;
  expect(opp.reviewStatus).toBe("COMPLETED");
});

describe("setFirstViewedIfNeeded", () => {
  beforeEach(() => {
    // add required mobx annotations to our mocks
    referralSub.isHydrated = false;
    makeObservable(referralSub, { isHydrated: observable });
    updatesSub.isHydrated = false;
    updatesSub.data = undefined;
    makeObservable(updatesSub, { isHydrated: observable, data: observable });

    // configure a mock user who is viewing this opportunity
    root.workflowsStore.user = mockUser;
    mockUserStateCode.mockReturnValue(mockUser.info.stateCode);
  });

  test("waits for hydration", () => {
    opp.setFirstViewedIfNeeded();
    expect(updateOpportunityFirstViewedMock).not.toHaveBeenCalled();

    runInAction(() => {
      referralSub.isHydrated = true;
      updatesSub.isHydrated = true;
    });

    expect(updateOpportunityFirstViewedMock).toHaveBeenCalled();
  });

  test("updates Firestore when there are no updates", () => {
    runInAction(() => {
      referralSub.isHydrated = true;
      updatesSub.isHydrated = true;
    });

    opp.setFirstViewedIfNeeded();

    expect(updateOpportunityFirstViewedMock).toHaveBeenCalledWith(
      "test@email.gov",
      ineligibleClientRecord.recordId,
      "TEST"
    );
  });

  test("does not update Firestore", () => {
    runInAction(() => {
      referralSub.isHydrated = true;
      updatesSub.isHydrated = true;
      updatesSub.data = { firstViewed: { by: "foo", date: jest.fn() } };
    });

    opp.setFirstViewedIfNeeded();

    expect(updateOpportunityFirstViewedMock).not.toHaveBeenCalled();
  });

  test("does not ignore Recidiviz users", () => {
    runInAction(() => {
      referralSub.isHydrated = true;
      updatesSub.isHydrated = true;
    });
    mockUserStateCode.mockReturnValue("RECIDIVIZ");

    opp.setFirstViewedIfNeeded();

    expect(updateOpportunityFirstViewedMock).toHaveBeenCalled();
  });

  test("ignores Recidiviz users in prod", () => {
    process.env.REACT_APP_DEPLOY_ENV = "production";

    runInAction(() => {
      referralSub.isHydrated = true;
      updatesSub.isHydrated = true;
    });
    mockUserStateCode.mockReturnValue("RECIDIVIZ");

    opp.setFirstViewedIfNeeded();

    expect(updateOpportunityFirstViewedMock).not.toHaveBeenCalled();
  });
});
