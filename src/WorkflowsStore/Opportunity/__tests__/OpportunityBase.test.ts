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

import { add, format, sub } from "date-fns";
import { DocumentData } from "firebase/firestore";
import { configure, runInAction } from "mobx";
import timekeeper from "timekeeper";

import { CombinedUserRecord, OpportunityUpdate } from "../../../FirestoreStore";
import { RootStore } from "../../../RootStore";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import { formatDateToISO } from "../../../utils";
import { Client } from "../../Client";
import { DocumentSubscription, UpdateFunction } from "../../subscriptions";
import { OTHER_KEY } from "../../utils";
import { ineligibleClientRecord } from "../__fixtures__";
import { FormBase } from "../Forms/FormBase";
import {
  OpportunityBase,
  updateOpportunityEligibility,
} from "../OpportunityBase";
import { OpportunityType } from "../OpportunityConfigs";
import {
  COMPLETED_UPDATE,
  DENIED_UPDATE,
  INCOMPLETE_FORM_UPDATE,
  VIEWED_UPDATE,
} from "../testUtils";
import { Opportunity } from "../types";

jest.mock("../../subscriptions");
jest.mock("firebase/firestore");

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
    this.form = new FormBase<any>(this, root);
  }
}

function createTestUnit() {
  mockUser = {
    info: {
      stateCode: ineligibleClientRecord.stateCode,
      email: "test@email.gov",
      givenNames: "",
      hasCaseload: false,
      hasFacilityCaseload: false,
      id: "abc123",
      surname: "",
      role: "supervision_staff",
    },
  };
  root = new RootStore();
  mockUserStateCode = jest.spyOn(root.userStore, "stateCode", "get");
  jest
    .spyOn(root.workflowsStore, "currentUserEmail", "get")
    .mockReturnValue(mockUser.info.email);

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

  jest.spyOn(AnalyticsStore.prototype, "trackSetOpportunityStatus");
  jest.spyOn(AnalyticsStore.prototype, "trackSurfacedInList");
  jest.spyOn(AnalyticsStore.prototype, "trackOpportunityPreviewed");
  jest.spyOn(AnalyticsStore.prototype, "trackOpportunityMarkedEligible");
  jest.spyOn(AnalyticsStore.prototype, "trackOpportunitySnoozed");
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

describe("isSnoozed", () => {
  test("isSnoozed is false if there is no snooze", () => {
    expect(opp.isSnoozed).toBe(false);
  });

  test("isSnoozed is true if there is a snoozeUntil value", () => {
    mockHydration({
      updateData: {
        autoSnooze: {
          snoozeUntil: format(add(new Date(), { days: 1 }), "yyyy-MM-dd"),
          snoozedBy: "foo",
          snoozedOn: "2023-01-01",
        },
      },
    });
    expect(opp.isSnoozed).toBe(true);
  });

  test("isSnoozed is true if there is a snoozeForDays value", () => {
    mockHydration({
      updateData: {
        manualSnooze: {
          snoozeForDays: 20,
          snoozedBy: "foo",
          snoozedOn: format(new Date(), "yyyy-MM-dd"),
        },
      },
    });
    expect(opp.isSnoozed).toBe(true);
  });
});

describe("setLastViewed", () => {
  beforeEach(() => {
    jest.spyOn(root.firestoreStore, "updateOpportunityLastViewed");
  });
  test("waits for hydration", () => {
    opp.setLastViewed();
    expect(
      root.firestoreStore.updateOpportunityLastViewed
    ).not.toHaveBeenCalled();

    mockHydration();

    expect(root.firestoreStore.updateOpportunityLastViewed).toHaveBeenCalled();
  });

  test("updates Firestore when there are no updates", () => {
    mockHydration();

    opp.setLastViewed();

    expect(
      root.firestoreStore.updateOpportunityLastViewed
    ).toHaveBeenCalledWith(
      "test@email.gov",
      ineligibleClientRecord.recordId,
      "TEST"
    );
  });

  test("updates Firestore with latest viewed", () => {
    mockHydration({
      updateData: { lastViewed: { by: "foo", date: jest.fn() as any } },
    });

    opp.setLastViewed();

    expect(root.firestoreStore.updateOpportunityLastViewed).toHaveBeenCalled();
  });

  test("does not ignore Recidiviz users", () => {
    mockHydration();

    mockUserStateCode.mockReturnValue("RECIDIVIZ");

    opp.setLastViewed();

    expect(root.firestoreStore.updateOpportunityLastViewed).toHaveBeenCalled();
  });

  test("ignores Recidiviz users in prod", () => {
    process.env.REACT_APP_DEPLOY_ENV = "production";

    mockHydration();

    mockUserStateCode.mockReturnValue("RECIDIVIZ");

    opp.setLastViewed();

    expect(
      root.firestoreStore.updateOpportunityLastViewed
    ).not.toHaveBeenCalled();
  });

  test("Returns firstViewed if set and lastViewed is not set yet", () => {
    mockHydration({
      updateData: {
        firstViewed: { by: "foo", date: jest.fn() as any },
      },
    });
    expect(opp.lastViewed).not.toBeUndefined();
  });

  test("Returns undefined if firstViewed and lastViewed is not set yet", () => {
    mockHydration({
      updateData: {},
    });
    expect(opp.lastViewed).toBeUndefined();
  });
});

describe("setCompletedIfEligible", () => {
  beforeEach(() => {
    // configure a mock user who is viewing this opportunity
    jest.spyOn(root.workflowsStore, "user", "get").mockReturnValue(mockUser);
    jest.spyOn(root.firestoreStore, "updateOpportunityCompleted");
    mockUserStateCode.mockReturnValue(mockUser.info.stateCode);
  });

  test("waits for hydration", () => {
    opp.setCompletedIfEligible();
    expect(
      root.firestoreStore.updateOpportunityCompleted
    ).not.toHaveBeenCalled();

    mockHydration();

    expect(root.firestoreStore.updateOpportunityCompleted).toHaveBeenCalled();
  });

  test("updates Firestore", () => {
    mockHydration();

    opp.setCompletedIfEligible();

    expect(root.firestoreStore.updateOpportunityCompleted).toHaveBeenCalledWith(
      "test@email.gov",
      ineligibleClientRecord.recordId,
      "TEST"
    );
  });

  test("tracks event", () => {
    mockHydration();

    opp.setCompletedIfEligible();

    expect(root.analyticsStore.trackSetOpportunityStatus).toHaveBeenCalledWith({
      clientId: ineligibleClientRecord.pseudonymizedId,
      justiceInvolvedPersonId: ineligibleClientRecord.pseudonymizedId,
      opportunityType: "TEST",
      status: "COMPLETED",
    });
  });

  test("does not update Firestore if client is ineligible", () => {
    mockDenied();

    opp.setCompletedIfEligible();

    expect(
      root.firestoreStore.updateOpportunityCompleted
    ).not.toHaveBeenCalled();
  });

  test("does not update Firestore if workflow is already completed", () => {
    mockCompleted();

    opp.setCompletedIfEligible();

    expect(
      root.firestoreStore.updateOpportunityCompleted
    ).not.toHaveBeenCalled();
  });

  test("does not track event if client is ineligible", () => {
    mockDenied();

    opp.setCompletedIfEligible();

    expect(
      root.analyticsStore.trackSetOpportunityStatus
    ).not.toHaveBeenCalled();
  });

  test("does not track event if workflow is already completed", () => {
    mockCompleted();

    opp.setCompletedIfEligible();

    expect(
      root.analyticsStore.trackSetOpportunityStatus
    ).not.toHaveBeenCalled();
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
    jest.spyOn(root.firestoreStore, "updateOpportunityDenial");
    jest.spyOn(root.firestoreStore, "updateOpportunityCompleted");
  });

  test("updates reasons", async () => {
    const reasons = ["test1", "test2"];

    await opp.setDenialReasons(reasons);

    expect(root.firestoreStore.updateOpportunityDenial).toHaveBeenCalledWith(
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
    expect(root.firestoreStore.updateOpportunityCompleted).toHaveBeenCalledWith(
      mockUser.info.email,
      client.recordId,
      opp.type,
      true
    );
  });

  test("doesn't delete otherReason when OTHER is included", async () => {
    const reasons = ["test1", OTHER_KEY];

    await opp.setDenialReasons(reasons);

    expect(root.firestoreStore.updateOpportunityDenial).toHaveBeenCalledWith(
      mockUser.info.email,
      client.recordId,
      { reasons },
      opp.type,
      undefined
    );
  });

  test("setOtherReasonText", async () => {
    mockHydration();

    const otherReason = "some other reason";
    await opp.setOtherReasonText(otherReason);

    expect(root.firestoreStore.updateOpportunityDenial).toHaveBeenCalledWith(
      mockUser.info.email,
      client.recordId,
      { otherReason },
      opp.type
    );
  });
});

describe("tracking", () => {
  test("setting no reasons undoes a denial", async () => {
    const reasons: string[] = [];

    await opp.setDenialReasons(reasons);

    expect(root.analyticsStore.trackSetOpportunityStatus).toHaveBeenCalledWith({
      clientId: client.pseudonymizedId,
      justiceInvolvedPersonId: client.pseudonymizedId,
      status: "IN_PROGRESS",
      opportunityType: opp.type,
    });
    expect(
      root.analyticsStore.trackOpportunityMarkedEligible
    ).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityType: opp.type,
    });
  });

  test("tracks denial status", async () => {
    const reasons = ["test1", "test2"];

    await opp.setDenialReasons(reasons);

    expect(root.analyticsStore.trackSetOpportunityStatus).toHaveBeenCalledWith({
      clientId: client.pseudonymizedId,
      justiceInvolvedPersonId: client.pseudonymizedId,
      status: "DENIED",
      opportunityType: opp.type,
      deniedReasons: reasons,
    });
    expect(
      root.analyticsStore.trackOpportunityMarkedEligible
    ).not.toHaveBeenCalled();
  });

  test("list view tracking", () => {
    opp.trackListViewed();

    expect(root.analyticsStore.trackSurfacedInList).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityType: opp.type,
    });
  });

  test("preview tracking", async () => {
    opp.trackPreviewed();

    expect(root.analyticsStore.trackOpportunityPreviewed).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityType: opp.type,
    });
  });
});

describe("setAutoSnooze", () => {
  const defaultSnoozeUntilFn = (date: Date, o?: Opportunity) =>
    add(date, { days: 5 });

  beforeEach(() => {
    timekeeper.freeze(new Date(2023, 9, 25));
    jest.spyOn(root.firestoreStore, "updateOpportunityAutoSnooze");
  });

  test("when denial reasons are deleted", async () => {
    await opp.setAutoSnooze(defaultSnoozeUntilFn, []);
    expect(
      root.firestoreStore.updateOpportunityAutoSnooze
    ).toHaveBeenCalledWith(
      "TEST",
      "us_xx_001",
      {
        snoozeUntil: "2023-10-30",
        snoozedBy: "test@email.gov",
        snoozedOn: "2023-10-25",
      },
      true // deleteSnoozeField
    );
  });

  test("when there are denial reasons", async () => {
    await opp.setAutoSnooze(defaultSnoozeUntilFn, ["REASON"]);
    expect(
      root.firestoreStore.updateOpportunityAutoSnooze
    ).toHaveBeenCalledWith(
      "TEST",
      "us_xx_001",
      {
        snoozeUntil: "2023-10-30",
        snoozedBy: "test@email.gov",
        snoozedOn: "2023-10-25",
      },
      false // deleteSnoozeField
    );
  });

  test("tracks event", async () => {
    await opp.setAutoSnooze(defaultSnoozeUntilFn, ["REASON"]);
    expect(root.analyticsStore.trackOpportunitySnoozed).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityStatus: "PENDING",
      opportunityType: opp.type,
      snoozeUntil: "2023-10-30",
      reasons: ["REASON"],
    });
  });
});

describe("setManualSnooze", () => {
  beforeEach(() => {
    timekeeper.freeze(new Date(2023, 9, 25));
    jest.spyOn(root.firestoreStore, "updateOpportunityManualSnooze");
  });

  test("when denial reasons are deleted", async () => {
    await opp.setManualSnooze(5, []);
    expect(
      root.firestoreStore.updateOpportunityManualSnooze
    ).toHaveBeenCalledWith(
      "TEST",
      "us_xx_001",
      {
        snoozeForDays: 5,
        snoozedBy: "test@email.gov",
        snoozedOn: "2023-10-25",
      },
      true // deleteSnoozeField
    );
  });

  test("when there are denial reasons", async () => {
    await opp.setManualSnooze(5, ["REASON"]);
    expect(
      root.firestoreStore.updateOpportunityManualSnooze
    ).toHaveBeenCalledWith(
      "TEST",
      "us_xx_001",
      {
        snoozeForDays: 5,
        snoozedBy: "test@email.gov",
        snoozedOn: "2023-10-25",
      },
      false // deleteSnoozeField
    );
  });

  test("tracks event", async () => {
    await opp.setManualSnooze(5, ["REASON"]);
    expect(root.analyticsStore.trackOpportunitySnoozed).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityStatus: "PENDING",
      opportunityType: opp.type,
      snoozeForDays: 5,
      reasons: ["REASON"],
    });
  });
});

describe("updateOpportunityEligibility", () => {
  let record: DocumentData;
  const opportunityType = "LSU";
  const mockRecordId = "us_id_123";
  const snoozedOnDate = new Date(2023, 9, 25);
  let testUpdateFn: UpdateFunction<DocumentData>;

  beforeEach(() => {
    timekeeper.freeze(snoozedOnDate);
    jest.spyOn(root.firestoreStore, "deleteOpportunityDenialAndSnooze");
    testUpdateFn = updateOpportunityEligibility(
      opportunityType,
      mockRecordId,
      root
    );
  });

  test("when there's no record", async () => {
    await testUpdateFn(record);
    expect(
      root.firestoreStore.deleteOpportunityDenialAndSnooze
    ).not.toHaveBeenCalled();
  });

  test("when there's no denial reasons", async () => {
    record = { recordId: mockRecordId };
    await testUpdateFn(record);
    expect(
      root.firestoreStore.deleteOpportunityDenialAndSnooze
    ).not.toHaveBeenCalled();
  });

  test("when there's no snooze config", async () => {
    record = { denial: { reasons: ["test"] } };
    await testUpdateFn(record);
    expect(
      root.firestoreStore.deleteOpportunityDenialAndSnooze
    ).not.toHaveBeenCalled();
  });

  test("when there's manual snooze config and it is still valid", async () => {
    record = {
      denial: { reasons: ["test"] },
      manualSnooze: {
        snoozeForDays: 9,
        snoozedOn: formatDateToISO(snoozedOnDate),
      },
    };
    await testUpdateFn(record);
    expect(
      root.firestoreStore.deleteOpportunityDenialAndSnooze
    ).not.toHaveBeenCalled();
  });

  test("when there's auto snooze config and it is still valid", async () => {
    record = {
      denial: { reasons: ["test"] },
      autoSnooze: {
        snoozeUntil: formatDateToISO(add(snoozedOnDate, { days: 5 })),
        snoozedOn: snoozedOnDate,
      },
    };
    await testUpdateFn(record);
    expect(
      root.firestoreStore.deleteOpportunityDenialAndSnooze
    ).not.toHaveBeenCalled();
  });

  test("when there's auto snooze config and it is expired", async () => {
    record = {
      denial: { reasons: ["test"] },
      autoSnooze: {
        snoozeUntil: formatDateToISO(sub(snoozedOnDate, { days: 5 })),
        snoozedOn: snoozedOnDate,
      },
    };
    await testUpdateFn(record);
    expect(
      root.firestoreStore.deleteOpportunityDenialAndSnooze
    ).toHaveBeenCalledWith("LSU", "us_id_123");
  });

  test("when there's manual snooze config and it is expired", async () => {
    record = {
      denial: { reasons: ["test"] },
      autoSnooze: {
        snoozeForDays: 5,
        snoozedOn: snoozedOnDate,
      },
    };
    await testUpdateFn(record);
    expect(
      root.firestoreStore.deleteOpportunityDenialAndSnooze
    ).toHaveBeenCalledWith("LSU", "us_id_123");
  });
});
