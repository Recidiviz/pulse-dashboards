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

import { configure } from "mobx";

import { RootStore } from "../../../../RootStore";
import { Client } from "../../../Client";
import {
  UsTnExpirationEligibleClientRecord,
  UsTnExpirationReferralRecordFixture,
} from "../../UsTn/__fixtures__";
import { UsTnExpirationOpportunity } from "../../UsTn/UsTnExpirationOpportunity";
import { UsTnExpirationForm } from "../UsTnExpirationForm";

let rootStore: RootStore;
let form: UsTnExpirationForm;

function createTestUnit() {
  rootStore = new RootStore();
  rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  const person = new Client(
    { ...UsTnExpirationEligibleClientRecord, currentBalance: 125 },
    rootStore,
  );
  const opp = new UsTnExpirationOpportunity(person, {
    ...UsTnExpirationReferralRecordFixture,
    formInformation: {
      ...UsTnExpirationReferralRecordFixture.formInformation,
      latestFee: {
        contactDate: "2022-01-15",
        contactType: "FEEP",
        contactComment: "PAYMENT PLAN IN PLACE",
      },
    },
  });
  form = opp.form;
}

beforeEach(() => {
  configure({ safeDescriptors: false });
  createTestUnit();
});

afterEach(() => {
  configure({ safeDescriptors: true });
  vi.restoreAllMocks();
});

describe("fee history prefill", () => {
  test("includes the latest fee contact and balance by default", () => {
    const { feeHistory } = form.prefilledDataTransformer();

    expect(feeHistory).toContain("FEEP");
    expect(feeHistory).toContain("Current balance: $125");
  });

  test("is left blank when usTnHideFinesAndFees is on", () => {
    vi.spyOn(
      rootStore.userStore,
      "activeFeatureVariants",
      "get",
    ).mockReturnValue({ usTnHideFinesAndFees: {} });

    expect(form.prefilledDataTransformer().feeHistory).toBe("");
  });
});
