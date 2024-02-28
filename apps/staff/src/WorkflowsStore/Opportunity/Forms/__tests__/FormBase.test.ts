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

import { configure } from "mobx";

import { RootStore } from "../../../../RootStore";
import AnalyticsStore from "../../../../RootStore/AnalyticsStore";
import UserStore from "../../../../RootStore/UserStore";
import { Client } from "../../../Client";
import { formatFacilityHousingUnit } from "../../../utils";
import { OpportunityBase } from "../../OpportunityBase";
import { FormBase } from "../FormBase";

jest.mock("../../../subscriptions");

let rootStore: RootStore;
let opp: OpportunityBase<any, any>;
let client: Client;
let form: FormBase<any>;

class TestOpportunity extends OpportunityBase<Client, Record<string, any>> {}

function createTestUnit() {
  rootStore = new RootStore();
  rootStore.userStore = {
    isRecidivizUser: false,
  } as UserStore;
  client = {
    pseudonymizedId: "TEST123",
    rootStore,
    recordId: "us_id_001",
  } as Client;
  opp = new TestOpportunity(client, "LSU", rootStore);
  jest
    .spyOn(opp, "hydrationState", "get")
    .mockReturnValue({ status: "hydrated" });
  form = new FormBase<any>(opp, rootStore);
  opp.form = form;
}

beforeEach(() => {
  jest.resetAllMocks();
  configure({ safeDescriptors: false });
  createTestUnit();
  jest.spyOn(AnalyticsStore.prototype, "trackReferralFormDownloaded");
  jest.spyOn(AnalyticsStore.prototype, "trackReferralFormViewed");
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
    jest.spyOn(opp, "setCompletedIfEligible");
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
