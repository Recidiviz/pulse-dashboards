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

import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import { DocumentSubscription } from "../../subscriptions";
import { ineligibleClientRecord } from "../__fixtures__";
import { OpportunityWithFormBase } from "../OpportunityWithFormBase";
import { OpportunityType } from "../types";

jest.mock("../../subscriptions");

type TestForm = { foo: string };

type TestReferral = { formInformation: TestForm };

class TestOpportunity extends OpportunityWithFormBase<TestReferral, TestForm> {}

let opp: TestOpportunity;
let client: Client;
let root: RootStore;
let referralSub: DocumentSubscription<any>;
let updatesSub: DocumentSubscription<any>;

function createTestUnit() {
  root = new RootStore();
  // using an ineligible to avoid wasted work creating opportunities we don't need
  client = new Client(ineligibleClientRecord, root);
  opp = new TestOpportunity(client, "TEST" as OpportunityType);
}

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  createTestUnit();

  referralSub = opp.referralSubscription;
  updatesSub = opp.updatesSubscription;
  referralSub.isLoading = false;

  referralSub.isLoading = false;
});

afterEach(() => {
  jest.resetAllMocks();
  configure({ safeDescriptors: true });
});

test("form updates override prefilled data", () => {
  referralSub.data = { formInformation: { foo: "test1" } };

  expect(opp.formData).toEqual({ foo: "test1" });

  updatesSub.data = { referralForm: { data: { foo: "test2" } } };

  expect(opp.formData).toEqual({ foo: "test2" });
});
