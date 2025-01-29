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

import { add, format, parseISO, sub } from "date-fns";
import { DocumentData } from "firebase/firestore";
import { configure, runInAction } from "mobx";
import timekeeper from "timekeeper";
import { MockInstance } from "vitest";

import { OpportunityRecordBase, OpportunityType } from "~datatypes";
import { HydrationState } from "~hydration-utils";

import { CombinedUserRecord, OpportunityUpdate } from "../../../FirestoreStore";
import { RootStore } from "../../../RootStore";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import { formatDateToISO } from "../../../utils";
import { mockSupervisionOfficers } from "../../__fixtures__";
import { Client } from "../../Client";
import { DocumentSubscription, UpdateFunction } from "../../subscriptions";
import { OTHER_KEY } from "../../utils";
import { ineligibleClientRecord } from "../__fixtures__";
import { FormBase } from "../Forms/FormBase";
import {
  OpportunityBase,
  updateOpportunityEligibility,
} from "../OpportunityBase";
import { OpportunityConfiguration } from "../OpportunityConfigurations";
import {
  COMPLETED_UPDATE,
  DENIED_UPDATE,
  INCOMPLETE_FORM_UPDATE,
  VIEWED_UPDATE,
} from "../testUtils";
import { Opportunity } from "../types";

vi.mock("../../subscriptions");
vi.mock("firebase/firestore");

let opp: OpportunityBase<Client, Record<string, any>>;
let client: Client;
let root: RootStore;
let updatesSub: DocumentSubscription<any>;
let mockUser: CombinedUserRecord;
let mockUserStateCode: MockInstance;
let oppRecord: OpportunityRecordBase;

const statuses = {
  needsHydration: { status: "needs hydration" },
  loading: { status: "loading" },
  failed: { status: "failed", error: new Error("test") },
  hydrated: { status: "hydrated" },
} satisfies Record<string, HydrationState>;

class TestOpportunity extends OpportunityBase<Client, Record<string, any>> {
  form: FormBase<any>;

  constructor(oppClient: Client, type: OpportunityType, record: DocumentData) {
    super(oppClient, type, root, record);
    this.form = new FormBase<any>(this, root);
  }

  get config() {
    return {} as OpportunityConfiguration;
  }
}

function createTestUnit() {
  mockUser = {
    info: {
      stateCode: ineligibleClientRecord.stateCode,
      email: "test@email.gov",
      givenNames: "",
      id: "abc123",
      surname: "",
      recordType: "supervisionStaff",
      pseudonymizedId: "p123",
    },
  };
  root = new RootStore();
  mockUserStateCode = vi.spyOn(root.userStore, "stateCode", "get");
  vi.spyOn(root.userStore, "userEmail", "get").mockReturnValue(
    mockUser.info.email,
  );

  oppRecord = {
    stateCode: "US_OZ",
    externalId: "123",
    eligibleCriteria: {},
    ineligibleCriteria: {},
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: false,
  };

  // using an ineligible to avoid wasted work creating opportunities we don't need
  client = new Client(
    {
      ...ineligibleClientRecord,
      officerId: mockSupervisionOfficers[0].id,
      district: "DISTRICT1",
    },
    root,
  );
  return new TestOpportunity(client, "TEST" as OpportunityType, oppRecord);
}

function mockHydration({
  updateData,
}: {
  updateData?: OpportunityUpdate;
} = {}) {
  runInAction(() => {
    updatesSub.hydrationState = statuses.hydrated;

    vi.spyOn(
      (opp as TestOpportunity).form,
      "hydrationState",
      "get",
    ).mockReturnValue(statuses.hydrated);

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
        updated: { by: "foo", date: vi.fn() as any },
      },
    },
  });
}

function mockCompleted() {
  mockHydration({
    updateData: {
      completed: { update: { by: "foo", date: vi.fn() as any } },
    },
  });
}

function mockSubmitted() {
  mockHydration({
    updateData: {
      ...updatesSub.data,
      submitted: { by: "foo", date: vi.fn() as any },
    },
  });
}

const originalEnv = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = {
    ...originalEnv,
  };
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  opp = createTestUnit();

  updatesSub = opp.updatesSubscription;

  // configure a mock user who is viewing this opportunity
  vi.spyOn(root.workflowsStore, "user", "get").mockReturnValue(mockUser);
  vi.spyOn(AnalyticsStore.prototype, "trackSetOpportunityStatus");
  vi.spyOn(AnalyticsStore.prototype, "trackOpportunitySnoozed");

  mockUserStateCode.mockReturnValue(mockUser.info.stateCode);
});

afterEach(() => {
  process.env = originalEnv;
  vi.resetAllMocks();
  configure({ safeDescriptors: true });
});

describe("hydrationState", () => {
  test.each([
    [statuses.needsHydration, statuses.needsHydration],
    [statuses.needsHydration, statuses.loading],
    [statuses.needsHydration, statuses.hydrated],
  ])(
    "needs hydration (subs hydration %s + %s)",
    (hydrationStateA, hydrationStateB) => {
      vi.spyOn(
        (opp as TestOpportunity).form,
        "hydrationState",
        "get",
      ).mockReturnValue(hydrationStateA);
      updatesSub.hydrationState = hydrationStateB;
      expect(opp.hydrationState).toEqual({ status: "needs hydration" });

      vi.spyOn(
        (opp as TestOpportunity).form,
        "hydrationState",
        "get",
      ).mockReturnValue(hydrationStateB);
      updatesSub.hydrationState = hydrationStateA;
      expect(opp.hydrationState).toEqual({ status: "needs hydration" });
    },
  );

  test.each([
    [statuses.loading, statuses.loading],
    [statuses.loading, statuses.hydrated],
  ])("loading (subs hydration %s + %s)", (hydrationStateA, hydrationStateB) => {
    vi.spyOn(
      (opp as TestOpportunity).form,
      "hydrationState",
      "get",
    ).mockReturnValue(hydrationStateA);
    updatesSub.hydrationState = hydrationStateB;
    expect(opp.hydrationState).toEqual({ status: "loading" });

    vi.spyOn(
      (opp as TestOpportunity).form,
      "hydrationState",
      "get",
    ).mockReturnValue(hydrationStateB);
    updatesSub.hydrationState = hydrationStateA;
    expect(opp.hydrationState).toEqual({ status: "loading" });
  });

  test.each([
    [statuses.failed, statuses.failed],
    [statuses.failed, statuses.loading],
    [statuses.failed, statuses.hydrated],
    [statuses.failed, statuses.needsHydration],
  ])("failed (subs hydration %s + %s)", (hydrationStateA, hydrationStateB) => {
    vi.spyOn(
      (opp as TestOpportunity).form,
      "hydrationState",
      "get",
    ).mockReturnValue(hydrationStateA);
    updatesSub.hydrationState = hydrationStateB;
    expect(opp.hydrationState).toEqual({
      status: "failed",
      error: expect.any(Error),
    });

    vi.spyOn(
      (opp as TestOpportunity).form,
      "hydrationState",
      "get",
    ).mockReturnValue(hydrationStateB);
    updatesSub.hydrationState = hydrationStateA;
    expect(opp.hydrationState).toEqual({
      status: "failed",
      error: expect.any(Error),
    });
  });

  test("hydrated", () => {
    vi.spyOn(
      (opp as TestOpportunity).form,
      "hydrationState",
      "get",
    ).mockReturnValue(statuses.hydrated);
    updatesSub.hydrationState = statuses.hydrated;
    expect(opp.hydrationState).toEqual({ status: "hydrated" });
  });
});

test("hydrate", () => {
  opp.hydrate();
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

describe("snoozedOnDate", () => {
  test("with manual snooze set", () => {
    mockHydration({
      updateData: {
        manualSnooze: {
          snoozeForDays: 5,
          snoozedBy: "foo",
          snoozedOn: "2023-01-01",
        },
      },
    });
    expect(opp.snoozedOnDate).toEqual(parseISO("2023-01-01"));
  });

  test("with auto snooze set", () => {
    mockHydration({
      updateData: {
        autoSnooze: {
          snoozeUntil: "2023-01-10",
          snoozedBy: "foo",
          snoozedOn: "2023-01-10",
        },
      },
    });
    expect(opp.snoozedOnDate).toEqual(parseISO("2023-01-10"));
  });

  test("with no snooze set", () => {
    expect(opp.snoozedOnDate).toBeUndefined();
  });
});

describe("setLastViewed", () => {
  beforeEach(() => {
    vi.spyOn(root.firestoreStore, "updateOpportunityLastViewed");
    vi.spyOn(
      (opp as TestOpportunity).form,
      "hydrationState",
      "get",
    ).mockReturnValue(statuses.hydrated);
  });
  test("waits for hydration", () => {
    opp.setLastViewed();
    expect(
      root.firestoreStore.updateOpportunityLastViewed,
    ).not.toHaveBeenCalled();

    mockHydration();

    expect(root.firestoreStore.updateOpportunityLastViewed).toHaveBeenCalled();
  });

  test("updates Firestore when there are no updates", () => {
    mockHydration();

    opp.setLastViewed();

    expect(
      root.firestoreStore.updateOpportunityLastViewed,
    ).toHaveBeenCalledWith("test@email.gov", opp);
  });

  test("updates Firestore with latest viewed", () => {
    mockHydration({
      updateData: { lastViewed: { by: "foo", date: vi.fn() as any } },
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
    import.meta.env.VITE_DEPLOY_ENV = "production";

    mockHydration();

    mockUserStateCode.mockReturnValue("RECIDIVIZ");

    opp.setLastViewed();

    expect(
      root.firestoreStore.updateOpportunityLastViewed,
    ).not.toHaveBeenCalled();
  });
});

describe("setCompletedIfEligible", () => {
  beforeEach(() => {
    // configure a mock user who is viewing this opportunity
    vi.spyOn(root.workflowsStore, "user", "get").mockReturnValue(mockUser);
    vi.spyOn(root.firestoreStore, "updateOpportunityCompleted");
    mockUserStateCode.mockReturnValue(mockUser.info.stateCode);
  });

  test("waits for hydration", () => {
    opp.setCompletedIfEligible();
    expect(
      root.firestoreStore.updateOpportunityCompleted,
    ).not.toHaveBeenCalled();

    mockHydration();

    expect(root.firestoreStore.updateOpportunityCompleted).toHaveBeenCalled();
  });

  test("updates Firestore", () => {
    mockHydration();

    opp.setCompletedIfEligible();

    expect(root.firestoreStore.updateOpportunityCompleted).toHaveBeenCalledWith(
      "test@email.gov",
      opp,
    );
  });

  test("tracks event", () => {
    mockHydration();

    opp.setCompletedIfEligible();

    expect(root.analyticsStore.trackSetOpportunityStatus).toHaveBeenCalledWith({
      justiceInvolvedPersonId: ineligibleClientRecord.pseudonymizedId,
      opportunityType: "TEST",
      status: "COMPLETED",
      opportunityId: opp.sentryTrackingId,
    });
  });

  test("does not update Firestore if client is ineligible", () => {
    mockDenied();

    opp.setCompletedIfEligible();

    expect(
      root.firestoreStore.updateOpportunityCompleted,
    ).not.toHaveBeenCalled();
  });

  test("does not update Firestore if workflow is already completed", () => {
    mockCompleted();

    opp.setCompletedIfEligible();

    expect(
      root.firestoreStore.updateOpportunityCompleted,
    ).not.toHaveBeenCalled();
  });

  test("does not track event if client is ineligible", () => {
    mockDenied();

    opp.setCompletedIfEligible();

    expect(
      root.analyticsStore.trackSetOpportunityStatus,
    ).not.toHaveBeenCalled();
  });

  test("does not track event if workflow is already completed", () => {
    mockCompleted();

    opp.setCompletedIfEligible();

    expect(
      root.analyticsStore.trackSetOpportunityStatus,
    ).not.toHaveBeenCalled();
  });
});

describe("setDenialReasons", () => {
  beforeEach(() => {
    vi.spyOn(root.firestoreStore, "updateOpportunityDenial");
    vi.spyOn(root.firestoreStore, "updateOpportunityCompleted");
  });

  test("updates reasons", async () => {
    const reasons = ["test1", "test2"];

    await opp.setDenialReasons(reasons);

    expect(root.firestoreStore.updateOpportunityDenial).toHaveBeenCalledWith(
      mockUser.info.email,
      opp,
      { reasons },
      { otherReason: true },
    );
  });

  test("reverts completion", async () => {
    const reasons = ["test1", "test2"];

    await opp.setDenialReasons(reasons);
    expect(root.firestoreStore.updateOpportunityCompleted).toHaveBeenCalledWith(
      mockUser.info.email,
      opp,
      true,
    );
  });

  test("doesn't delete otherReason when OTHER is included", async () => {
    const reasons = ["test1", OTHER_KEY];

    await opp.setDenialReasons(reasons);

    expect(root.firestoreStore.updateOpportunityDenial).toHaveBeenCalledWith(
      mockUser.info.email,
      opp,
      { reasons },
      undefined,
    );
  });

  test("setOtherReasonText", async () => {
    mockHydration();

    const otherReason = "some other reason";
    await opp.setOtherReasonText(otherReason);

    expect(root.firestoreStore.updateOpportunityDenial).toHaveBeenCalledWith(
      mockUser.info.email,
      opp,
      { otherReason },
    );
  });
});

describe("markSubmittedAndGenerateToast", () => {
  beforeEach(() => {
    vi.spyOn(root.firestoreStore, "updateOpportunitySubmitted");
  });
  test("marks submitted when feature variant is set and opportunity supports submitted", async () => {
    vi.spyOn(root.userStore, "activeFeatureVariants", "get").mockReturnValue({
      submittedOpportunityStatus: {},
    });
    vi.spyOn(opp, "config", "get").mockReturnValue({
      supportsSubmitted: true,
    } as OpportunityConfiguration);
    const message = await opp.markSubmittedAndGenerateToast();

    expect(root.firestoreStore.updateOpportunitySubmitted).toHaveBeenCalled();
    expect(message).not.toBeUndefined();
  });

  test("doesn't mark submitted without feature variant", async () => {
    vi.spyOn(opp, "config", "get").mockReturnValue({
      supportsSubmitted: true,
    } as OpportunityConfiguration);
    const message = await opp.markSubmittedAndGenerateToast();

    expect(
      root.firestoreStore.updateOpportunitySubmitted,
    ).not.toHaveBeenCalled();
    expect(message).toBeUndefined();
  });

  test("doesn't mark submitted when opportunity doesn't support submitted", async () => {
    vi.spyOn(root.userStore, "activeFeatureVariants", "get").mockReturnValue({
      submittedOpportunityStatus: {},
    });
    const message = await opp.markSubmittedAndGenerateToast();

    expect(
      root.firestoreStore.updateOpportunitySubmitted,
    ).not.toHaveBeenCalled();
    expect(message).toBeUndefined();
  });
});

describe("tracking", () => {
  test("setting no reasons undoes a denial", async () => {
    const reasons: string[] = [];

    await opp.setDenialReasons(reasons);

    expect(root.analyticsStore.trackSetOpportunityStatus).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      status: "PENDING",
      opportunityType: opp.type,
      opportunityId: opp.sentryTrackingId,
    });
  });

  test("tracks denial status", async () => {
    const reasons = ["test1", "test2"];

    await opp.setDenialReasons(reasons);

    expect(root.analyticsStore.trackSetOpportunityStatus).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      status: "DENIED",
      opportunityType: opp.type,
      deniedReasons: reasons,
      opportunityId: opp.sentryTrackingId,
    });
  });

  test("list view tracking for single search type", () => {
    root.workflowsStore.supervisionStaffSubscription.data =
      mockSupervisionOfficers;
    root.workflowsStore.updateActiveSystem("SUPERVISION");
    vi.spyOn(root.workflowsStore, "systemConfigFor").mockReturnValue({
      search: [{ searchType: "OFFICER", searchField: ["officerId"] }],
    });
    vi.spyOn(AnalyticsStore.prototype, "trackSurfacedInList");
    opp.trackListViewed();

    expect(root.analyticsStore.trackSurfacedInList).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityType: opp.type,
      searchField: "officerId",
      searchIdValue: mockSupervisionOfficers[0].pseudonymizedId,
      tabTitle: opp.tabTitle(),
      opportunityId: opp.sentryTrackingId,
    });
  });

  test("list view tracking for multiple search type only lists first searchField", () => {
    root.workflowsStore.supervisionStaffSubscription.data =
      mockSupervisionOfficers;
    root.workflowsStore.updateActiveSystem("SUPERVISION");
    vi.spyOn(root.workflowsStore, "systemConfigFor").mockReturnValue({
      search: [
        { searchType: "LOCATION", searchField: ["district"] },
        { searchType: "OFFICER", searchField: ["officerId"] },
      ],
    });
    vi.spyOn(AnalyticsStore.prototype, "trackSurfacedInList");
    opp.trackListViewed();

    expect(root.analyticsStore.trackSurfacedInList).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityType: opp.type,
      searchField: "district",
      searchIdValue: `DISTRICT1,${mockSupervisionOfficers[0].pseudonymizedId}`,
      tabTitle: opp.tabTitle(),
      opportunityId: opp.sentryTrackingId,
    });
  });

  test("preview tracking", async () => {
    vi.spyOn(AnalyticsStore.prototype, "trackOpportunityPreviewed");
    opp.trackPreviewed();

    expect(root.analyticsStore.trackOpportunityPreviewed).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityType: opp.type,
      opportunityId: opp.sentryTrackingId,
    });
  });

  test("denying a submitted event tracks both changes", async () => {
    vi.spyOn(AnalyticsStore.prototype, "trackOpportunityUnsubmitted");
    mockSubmitted();
    const reasons = ["test1", "test2"];
    await opp.setDenialReasons(reasons);

    expect(
      root.analyticsStore.trackOpportunityUnsubmitted,
    ).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityType: opp.type,
      opportunityId: opp.sentryTrackingId,
    });

    expect(root.analyticsStore.trackSetOpportunityStatus).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      status: "DENIED",
      opportunityType: opp.type,
      deniedReasons: reasons,
      opportunityId: opp.sentryTrackingId,
    });
  });

  test("submitting a denied event tracks both changes", async () => {
    vi.spyOn(AnalyticsStore.prototype, "trackOpportunityMarkedSubmitted");
    vi.spyOn(
      root.firestoreStore,
      "updateOpportunitySubmitted",
    ).mockImplementation(async () => {
      mockSubmitted();
    });
    vi.spyOn(
      root.firestoreStore,
      "deleteOpportunityDenialAndSnooze",
    ).mockImplementation(async () => {
      // delete the denial from the record
      const { denial, ...rest } = updatesSub.data;
      mockHydration({ updateData: rest });
    });
    vi.spyOn(root.userStore, "activeFeatureVariants", "get").mockReturnValue({
      submittedOpportunityStatus: {},
    });

    mockDenied();
    // @ts-expect-error calling private method to bypass checks in wrapper
    await opp.markSubmitted();

    expect(
      root.analyticsStore.trackOpportunityMarkedSubmitted,
    ).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityType: opp.type,
      opportunityId: opp.sentryTrackingId,
    });

    expect(
      root.analyticsStore.trackSetOpportunityStatus,
    ).toHaveBeenLastCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      status: "SUBMITTED",
      opportunityType: opp.type,
      opportunityId: opp.sentryTrackingId,
    });
  });
});

describe("setAutoSnooze", () => {
  const autoSnoozeParams = (date: Date, o?: Opportunity) =>
    add(date, { days: 5 });

  beforeEach(() => {
    timekeeper.freeze(new Date(2023, 9, 25));
    vi.spyOn(root.firestoreStore, "updateOpportunityAutoSnooze");
  });

  test("when denial reasons are deleted", async () => {
    await opp.setAutoSnooze(autoSnoozeParams, []);
    expect(
      root.firestoreStore.updateOpportunityAutoSnooze,
    ).toHaveBeenCalledWith(
      opp,
      {
        snoozeUntil: "2023-10-30",
        snoozedBy: "test@email.gov",
        snoozedOn: "2023-10-25",
      },
      true, // deleteSnoozeField
    );
  });

  test("when there are denial reasons", async () => {
    await opp.setAutoSnooze(autoSnoozeParams, ["REASON"]);
    expect(
      root.firestoreStore.updateOpportunityAutoSnooze,
    ).toHaveBeenCalledWith(
      opp,
      {
        snoozeUntil: "2023-10-30",
        snoozedBy: "test@email.gov",
        snoozedOn: "2023-10-25",
      },
      false, // deleteSnoozeField
    );
  });

  test("tracks event", async () => {
    await opp.setAutoSnooze(autoSnoozeParams, ["REASON"]);
    expect(root.analyticsStore.trackOpportunitySnoozed).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityStatus: "PENDING",
      opportunityType: opp.type,
      snoozeUntil: "2023-10-30",
      reasons: ["REASON"],
      opportunityId: opp.sentryTrackingId,
    });
  });
});

describe("setManualSnooze", () => {
  beforeEach(() => {
    timekeeper.freeze(new Date(2023, 9, 25));
    vi.spyOn(root.firestoreStore, "updateOpportunityManualSnooze");
  });

  test("when denial reasons are deleted", async () => {
    await opp.setManualSnooze(5, []);
    expect(
      root.firestoreStore.updateOpportunityManualSnooze,
    ).toHaveBeenCalledWith(
      opp,
      {
        snoozeForDays: 5,
        snoozedBy: "test@email.gov",
        snoozedOn: "2023-10-25",
      },
      true, // deleteSnoozeField
    );
  });

  test("when there are denial reasons", async () => {
    await opp.setManualSnooze(5, ["REASON"]);
    expect(
      root.firestoreStore.updateOpportunityManualSnooze,
    ).toHaveBeenCalledWith(
      opp,
      {
        snoozeForDays: 5,
        snoozedBy: "test@email.gov",
        snoozedOn: "2023-10-25",
      },
      false, // deleteSnoozeField
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
      opportunityId: opp.sentryTrackingId,
    });
  });
});

describe("updateOpportunityEligibility", () => {
  let record: DocumentData;
  const mockRecordId = "us_id_123";
  const snoozedOnDate = new Date(2023, 9, 25);
  let testUpdateFn: UpdateFunction<DocumentData>;

  beforeEach(() => {
    timekeeper.freeze(snoozedOnDate);
    vi.spyOn(root.firestoreStore, "deleteOpportunityDenialAndSnooze");
    testUpdateFn = updateOpportunityEligibility(opp, root);
  });

  test("when there's no denial reasons", async () => {
    record = { recordId: mockRecordId };
    await testUpdateFn(record);
    expect(
      root.firestoreStore.deleteOpportunityDenialAndSnooze,
    ).not.toHaveBeenCalled();
  });

  test("when there's no snooze config", async () => {
    record = { denial: { reasons: ["test"] } };
    await testUpdateFn(record);
    expect(
      root.firestoreStore.deleteOpportunityDenialAndSnooze,
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
      root.firestoreStore.deleteOpportunityDenialAndSnooze,
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
      root.firestoreStore.deleteOpportunityDenialAndSnooze,
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
      root.firestoreStore.deleteOpportunityDenialAndSnooze,
    ).toHaveBeenCalledWith(opp);
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
      root.firestoreStore.deleteOpportunityDenialAndSnooze,
    ).toHaveBeenCalledWith(opp);
  });
});
