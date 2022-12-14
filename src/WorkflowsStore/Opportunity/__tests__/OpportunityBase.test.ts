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

import { configure, runInAction } from "mobx";

import {
  trackOpportunityMarkedEligible,
  trackOpportunityPreviewed,
  trackSetOpportunityStatus,
  trackSurfacedInList,
} from "../../../analytics";
import {
  CombinedUserRecord,
  OpportunityUpdate,
  updateOpportunityCompleted,
  updateOpportunityDenial,
  updateOpportunityFirstViewed,
} from "../../../firestore";
import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import { DocumentSubscription } from "../../subscriptions";
import { OTHER_KEY } from "../../utils";
import { ineligibleClientRecord } from "../__fixtures__";
import { FormBase } from "../Forms/FormBase";
import { OpportunityBase } from "../OpportunityBase";
import {
  COMPLETED_UPDATE,
  DENIED_UPDATE,
  INCOMPLETE_FORM_UPDATE,
  VIEWED_UPDATE,
} from "../testUtils";
import { OpportunityType } from "../types";

jest.mock("../../subscriptions");
jest.mock("../../../firestore");
jest.mock("../../../analytics");

const updateOpportunityFirstViewedMock = updateOpportunityFirstViewed as jest.Mock;
const updateOpportunityCompletedMock = updateOpportunityCompleted as jest.Mock;
const trackSetOpportunityStatusMock = trackSetOpportunityStatus as jest.Mock;
const mockUpdateOpportunityDenial = updateOpportunityDenial as jest.Mock;
const mockUpdateOpportunityCompleted = updateOpportunityCompleted as jest.Mock;

let opp: OpportunityBase<Client, any>;
let client: Client;
let root: RootStore;
let referralSub: DocumentSubscription<any>;
let updatesSub: DocumentSubscription<any>;
let mockUser: CombinedUserRecord;
let mockUserStateCode: jest.SpyInstance;

class TestOpportunity extends OpportunityBase<Client, Record<string, any>> {
  form: FormBase<any>;

  constructor(oppClient: Client, type: OpportunityType) {
    super(oppClient, type, root);
    this.form = new FormBase<any>("LSU", this, root);
  }
}

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

function mockHydration({
  referralData,
  updateData,
}: {
  referralData?: any;
  updateData?: OpportunityUpdate;
} = {}) {
  runInAction(() => {
    referralSub.isHydrated = true;
    updatesSub.isHydrated = true;
    if (referralData) {
      referralSub.data = referralData;
    }
    if (updateData) {
      updatesSub.data = updateData;
    }
  });
}

function mockDenied() {
  mockHydration({
    updateData: {
      denial: {
        reasons: ["boo"],
        updated: { by: "foo", date: jest.fn() as any },
      },
    },
  });
}

function mockCompleted() {
  mockHydration({
    updateData: {
      completed: { update: { by: "foo", date: jest.fn() as any } },
    },
  });
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

  referralSub = opp.referralSubscription;
  updatesSub = opp.updatesSubscription;

  // configure a mock user who is viewing this opportunity
  jest.spyOn(root.workflowsStore, "user", "get").mockReturnValue(mockUser);
  mockUserStateCode.mockReturnValue(mockUser.info.stateCode);
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
  test("waits for hydration", () => {
    opp.setFirstViewedIfNeeded();
    expect(updateOpportunityFirstViewedMock).not.toHaveBeenCalled();

    mockHydration();

    expect(updateOpportunityFirstViewedMock).toHaveBeenCalled();
  });

  test("updates Firestore when there are no updates", () => {
    mockHydration();

    opp.setFirstViewedIfNeeded();

    expect(updateOpportunityFirstViewedMock).toHaveBeenCalledWith(
      "test@email.gov",
      ineligibleClientRecord.recordId,
      "TEST"
    );
  });

  test("does not update Firestore", () => {
    mockHydration({
      updateData: { firstViewed: { by: "foo", date: jest.fn() as any } },
    });

    opp.setFirstViewedIfNeeded();

    expect(updateOpportunityFirstViewedMock).not.toHaveBeenCalled();
  });

  test("does not ignore Recidiviz users", () => {
    mockHydration();

    mockUserStateCode.mockReturnValue("RECIDIVIZ");

    opp.setFirstViewedIfNeeded();

    expect(updateOpportunityFirstViewedMock).toHaveBeenCalled();
  });

  test("ignores Recidiviz users in prod", () => {
    process.env.REACT_APP_DEPLOY_ENV = "production";

    mockHydration();

    mockUserStateCode.mockReturnValue("RECIDIVIZ");

    opp.setFirstViewedIfNeeded();

    expect(updateOpportunityFirstViewedMock).not.toHaveBeenCalled();
  });
});

describe("setCompletedIfEligible", () => {
  beforeEach(() => {
    // configure a mock user who is viewing this opportunity
    jest.spyOn(root.workflowsStore, "user", "get").mockReturnValue(mockUser);
    mockUserStateCode.mockReturnValue(mockUser.info.stateCode);
  });

  test("waits for hydration", () => {
    opp.setCompletedIfEligible();
    expect(updateOpportunityCompletedMock).not.toHaveBeenCalled();

    mockHydration();

    expect(updateOpportunityCompletedMock).toHaveBeenCalled();
  });

  test("updates Firestore", () => {
    mockHydration();

    opp.setCompletedIfEligible();

    expect(updateOpportunityCompletedMock).toHaveBeenCalledWith(
      "test@email.gov",
      ineligibleClientRecord.recordId,
      "TEST"
    );
  });

  test("tracks event", () => {
    mockHydration();

    opp.setCompletedIfEligible();

    expect(trackSetOpportunityStatusMock).toHaveBeenCalledWith({
      clientId: ineligibleClientRecord.pseudonymizedId,
      justiceInvolvedPersonId: ineligibleClientRecord.pseudonymizedId,
      opportunityType: "TEST",
      status: "COMPLETED",
    });
  });

  test("does not update Firestore if client is ineligible", () => {
    mockDenied();

    opp.setCompletedIfEligible();

    expect(updateOpportunityCompletedMock).not.toHaveBeenCalled();
  });

  test("does not update Firestore if workflow is already completed", () => {
    mockCompleted();

    opp.setCompletedIfEligible();

    expect(updateOpportunityCompletedMock).not.toHaveBeenCalled();
  });

  test("does not track event if client is ineligible", () => {
    mockDenied();

    opp.setCompletedIfEligible();

    expect(trackSetOpportunityStatusMock).not.toHaveBeenCalled();
  });

  test("does not track event if workflow is already completed", () => {
    mockCompleted();

    opp.setCompletedIfEligible();

    expect(trackSetOpportunityStatusMock).not.toHaveBeenCalled();
  });
});

test("form updates override prefilled data", () => {
  referralSub.data = { formInformation: { foo: "test1" } };

  expect(opp.form?.formData).toEqual({ foo: "test1" });

  updatesSub.data = { referralForm: { data: { foo: "test2" } } };

  expect(opp.form?.formData).toEqual({ foo: "test2" });
});

describe("setDenialReasons", () => {
  beforeEach(() => {
    mockUpdateOpportunityDenial.mockResolvedValue(undefined);
    mockUpdateOpportunityCompleted.mockResolvedValue(undefined);
  });

  test("updates reasons", async () => {
    const reasons = ["test1", "test2"];

    await opp.setDenialReasons(reasons);

    expect(updateOpportunityDenial).toHaveBeenCalledWith(
      mockUser.info.email,
      client.recordId,
      { reasons },
      opp.type,
      { otherReason: true }
    );
  });

  test("reverts completion", async () => {
    const reasons = ["test1", "test2"];

    await opp.setDenialReasons(reasons);
    expect(updateOpportunityCompleted).toHaveBeenCalledWith(
      mockUser.info.email,
      client.recordId,
      opp.type,
      true
    );
  });

  test("doesn't delete otherReason when OTHER is included", async () => {
    const reasons = ["test1", OTHER_KEY];

    await opp.setDenialReasons(reasons);

    expect(mockUpdateOpportunityDenial).toHaveBeenCalledWith(
      mockUser.info.email,
      client.recordId,
      { reasons },
      opp.type,
      undefined
    );
  });

  test("tracks denial status", async () => {
    const reasons = ["test1", "test2"];

    await opp.setDenialReasons(reasons);

    expect(trackSetOpportunityStatus).toHaveBeenCalledWith({
      clientId: client.pseudonymizedId,
      justiceInvolvedPersonId: client.pseudonymizedId,
      status: "DENIED",
      opportunityType: opp.type,
      deniedReasons: reasons,
    });
    expect(trackOpportunityMarkedEligible).not.toHaveBeenCalled();
  });

  test("setting no reasons undoes a denial", async () => {
    const reasons: string[] = [];

    await opp.setDenialReasons(reasons);

    expect(trackSetOpportunityStatus).toHaveBeenCalledWith({
      clientId: client.pseudonymizedId,
      justiceInvolvedPersonId: client.pseudonymizedId,
      status: "IN_PROGRESS",
      opportunityType: opp.type,
    });
    expect(trackOpportunityMarkedEligible).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityType: opp.type,
    });
  });
});

test("setOtherReasonText", async () => {
  mockHydration();

  const otherReason = "some other reason";
  await opp.setOtherReasonText(otherReason);

  expect(updateOpportunityDenial).toHaveBeenCalledWith(
    mockUser.info.email,
    client.recordId,
    { otherReason },
    opp.type
  );
});

test("list view tracking", () => {
  opp.trackListViewed();

  expect(trackSurfacedInList).toHaveBeenCalledWith({
    justiceInvolvedPersonId: client.pseudonymizedId,
    opportunityType: opp.type,
  });
});

test("preview tracking", async () => {
  opp.trackPreviewed();

  expect(trackOpportunityPreviewed).toHaveBeenCalledWith({
    justiceInvolvedPersonId: client.pseudonymizedId,
    opportunityType: opp.type,
  });
});
