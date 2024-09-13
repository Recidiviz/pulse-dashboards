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

import { configure } from "mobx";

import { RootStore } from "../../../../RootStore";
import AnalyticsStore from "../../../../RootStore/AnalyticsStore";
import UserStore from "../../../../RootStore/UserStore";
import { Client } from "../../../Client";
import { formatFacilityHousingUnit } from "../../../utils";
import { OpportunityBase } from "../../OpportunityBase";
import { FormBase } from "../FormBase";

vi.mock("../../../subscriptions");
vi.mock("firebase/firestore");

let rootStore: RootStore;
let opp: OpportunityBase<any, any>;
let client: Client;
let form: FormBase<any>;

class TestOpportunity extends OpportunityBase<Client, Record<string, any>> {}

function createTestUnit() {
  rootStore = new RootStore();
  rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  rootStore.userStore = {
    isRecidivizUser: false,
    activeFeatureVariants: {},
  } as UserStore;
  client = {
    pseudonymizedId: "TEST123",
    rootStore,
    recordId: "us_id_001",
  } as Client;
  opp = new TestOpportunity(client, "LSU", rootStore);
  vi.spyOn(opp, "hydrationState", "get").mockReturnValue({
    status: "hydrated",
  });
  form = new FormBase<any>(opp, rootStore);
  opp.form = form;
}

beforeEach(() => {
  vi.resetAllMocks();
  configure({ safeDescriptors: false });
  createTestUnit();
  vi.spyOn(AnalyticsStore.prototype, "trackReferralFormDownloaded");
  vi.spyOn(AnalyticsStore.prototype, "trackReferralFormViewed");
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

test("form view tracking", () => {
  form.trackViewed();

  expect(rootStore.analyticsStore.trackReferralFormViewed).toHaveBeenCalledWith(
    {
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityType: "LSU",
    },
  );
});

describe("form downloading", () => {
  test("sets a flag", () => {
    expect(rootStore.workflowsStore.formIsDownloading).toBe(false);

    form.markDownloading();

    expect(rootStore.workflowsStore.formIsDownloading).toBe(true);
  });
});

describe("record form download", () => {
  test("updates opportunity status", () => {
    vi.spyOn(opp, "setCompletedIfEligible");
    form.recordSuccessfulDownload();

    expect(opp.setCompletedIfEligible).toHaveBeenCalled();
  });

  test("sends tracking event", () => {
    form.recordSuccessfulDownload();
    expect(
      rootStore.analyticsStore.trackReferralFormDownloaded,
    ).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityType: form.type,
    });
  });
});

describe("draft data", () => {
  test("uses form updates subscription", async () => {
    vi.spyOn(form, "updates", "get").mockReturnValue({
      updated: { by: "user", date: vi.fn() as any },
      data: { foo: "bar" },
    });
    expect(form.draftData).toEqual({ foo: "bar" });
  });
});

describe("form update analytics functions", () => {
  test("recordEdit sends edit tracking event", () => {
    vi.spyOn(AnalyticsStore.prototype, "trackReferralFormEdited");
    form.recordEdit();
    expect(
      rootStore.analyticsStore.trackReferralFormEdited,
    ).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityType: form.type,
    });
  });

  test("recordFirstEdit sends first edit tracking event", () => {
    vi.spyOn(AnalyticsStore.prototype, "trackReferralFormFirstEdited");
    form.recordFirstEdit();
    expect(
      rootStore.analyticsStore.trackReferralFormFirstEdited,
    ).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityType: form.type,
    });
  });

  test("recordStatusInProgress sends status change tracking event", () => {
    vi.spyOn(AnalyticsStore.prototype, "trackSetOpportunityStatus");
    form.recordStatusInProgress();
    expect(
      rootStore.analyticsStore.trackSetOpportunityStatus,
    ).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityType: form.type,
      status: "IN_PROGRESS",
    });
  });
});

describe("form update", () => {
  test("updates in firestore using updateForm", async () => {
    vi.spyOn(rootStore.firestoreStore, "updateForm");
    vi.spyOn(rootStore.firestoreStore, "updateOpportunity");
    const testField = "testField";
    const testValue = "testValue";
    await form.updateDraftData(testField, testValue);
    expect(rootStore.firestoreStore.updateForm).toHaveBeenCalledWith(
      client.recordId,
      expect.objectContaining({
        data: { testField: testValue },
      }),
      form.formId,
    );
    expect(rootStore.firestoreStore.updateOpportunity).not.toHaveBeenCalled();
  });

  test("tracks first edit", async () => {
    vi.spyOn(form, "recordEdit");
    vi.spyOn(form, "recordFirstEdit");
    const testField = "testField";
    const testValue = "testValue";
    await form.updateDraftData(testField, testValue);
    expect(form.recordEdit).toBeCalled();
    expect(form.recordFirstEdit).toBeCalled();
  });

  test("doesn't track first edit for repeated edit", async () => {
    vi.spyOn(form, "formLastUpdated", "get").mockReturnValue({
      date: vi.fn() as any,
      by: "user",
    });
    vi.spyOn(form, "recordEdit");
    vi.spyOn(form, "recordFirstEdit");
    const testField = "testField";
    const testValue = "testValue";
    await form.updateDraftData(testField, testValue);
    expect(form.recordEdit).toBeCalled();
    expect(form.recordFirstEdit).not.toBeCalled();
  });

  test("tracks in progress status for pending status", async () => {
    vi.spyOn(opp, "reviewStatus", "get").mockReturnValue("PENDING");
    vi.spyOn(form, "recordStatusInProgress");
    const testField = "testField";
    const testValue = "testValue";
    await form.updateDraftData(testField, testValue);
    expect(form.recordStatusInProgress).toBeCalled();
  });

  test("skips status tracking for other status", async () => {
    vi.spyOn(opp, "reviewStatus", "get").mockReturnValue("COMPLETED");
    vi.spyOn(form, "recordStatusInProgress");
    const testField = "testField";
    const testValue = "testValue";
    await form.updateDraftData(testField, testValue);
    expect(form.recordStatusInProgress).not.toBeCalled();
  });
});

describe("form clear data", () => {
  test("calls updateForm with no referralForm field", async () => {
    vi.spyOn(rootStore.firestoreStore, "updateForm");
    vi.spyOn(rootStore.firestoreStore, "updateOpportunity");
    await form.clearDraftData();
    expect(rootStore.firestoreStore.updateForm).toHaveBeenCalledWith(
      client.recordId,
      { data: undefined },
      form.formId,
    );
    expect(rootStore.firestoreStore.updateOpportunity).not.toHaveBeenCalled();
  });
});

describe("form id", () => {
  test("uses opp type when updates aren't shared across opps", async () => {
    vi.spyOn(form, "shareFormUpdates", "get").mockReturnValue(false);
    vi.spyOn(form, "formType", "get").mockReturnValue("testForm");
    expect(form.formId).toEqual(`testForm-LSU`);
  });

  test("uses 'common' when updates are shared across opps", async () => {
    vi.spyOn(form, "shareFormUpdates", "get").mockReturnValue(true);
    vi.spyOn(form, "formType", "get").mockReturnValue("testForm");
    expect(form.formId).toEqual(`testForm-common`);
  });
});

describe("Test Furlough form", () => {
  test("facility/housing unit are defined", () => {
    const facilityId = "FAKE FACILITY";
    const unitId = "UNIT A";
    const result = formatFacilityHousingUnit(facilityId, unitId);

    expect(result).toBe("FAKE FACILITY/UNIT A");
  });

  test("Facility defined, housing unit undefined", () => {
    const facilityId = "FAKE FACILITY";
    const result = formatFacilityHousingUnit(facilityId, undefined);

    expect(result).toBe("FAKE FACILITY");
  });

  test("Facility/housing unit are undefined", () => {
    const result = formatFacilityHousingUnit(undefined, undefined);

    expect(result).toBe("");
  });
});
