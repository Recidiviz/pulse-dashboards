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

import {
  trackReferralFormDownloaded,
  trackReferralFormViewed,
} from "../../../../analytics";
import { RootStore } from "../../../../RootStore";
import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import { FormBase } from "../FormBase";

jest.mock("../../../../analytics");
jest.mock("../../../subscriptions");

let rootStore: RootStore;
let opp: OpportunityBase<any, any>;
let client: Client;
let form: FormBase<any>;

class TestOpportunity extends OpportunityBase<Client, Record<string, any>> {}

function createTestUnit() {
  rootStore = new RootStore();
  client = { pseudonymizedId: "TEST123", rootStore } as Client;
  opp = new TestOpportunity(client, "LSU", rootStore);
  jest.spyOn(opp, "isHydrated", "get").mockReturnValue(true);
  form = new FormBase<any>("LSU", opp, rootStore);
  opp.form = form;
}

beforeEach(() => {
  jest.resetAllMocks();
  configure({ safeDescriptors: false });
  createTestUnit();
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

test("form view tracking", () => {
  form.trackViewed();

  expect(trackReferralFormViewed).toHaveBeenCalledWith({
    justiceInvolvedPersonId: client.pseudonymizedId,
    opportunityType: "LSU",
  });
});

describe("form downloading", () => {
  test("sets a flag", () => {
    expect(rootStore.workflowsStore.formIsDownloading).toBe(false);

    form.download();

    expect(rootStore.workflowsStore.formIsDownloading).toBe(true);
  });

  test("updates opportunity status", () => {
    jest.spyOn(opp, "setCompletedIfEligible");
    form.download();

    expect(opp.setCompletedIfEligible).toHaveBeenCalled();
  });

  test("sends tracking event", () => {
    form.download();
    expect(trackReferralFormDownloaded).toHaveBeenCalledWith({
      justiceInvolvedPersonId: client.pseudonymizedId,
      opportunityType: form.type,
    });
  });
});
