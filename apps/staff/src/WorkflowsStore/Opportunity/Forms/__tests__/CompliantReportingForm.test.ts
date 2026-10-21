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

import { RootStore } from "../../../../RootStore";
import UserStore from "../../../../RootStore/UserStore";
import { UsTnCompliantReporting2025PolicyOpportunity } from "../../UsTn/UsTnCompliantReporting2025PolicyOpportunity";
import {
  CompliantReportingForm,
  US_TN_CR_BLANK_FEE_FIELDS,
} from "../CompliantReportingForm";

vi.mock("../../../subscriptions");
vi.mock("firebase/firestore");
vi.mock(
  "../../../../core/Paperwork/US_TN/CompliantReporting/Transformer",
  () => ({
    transform: () => ({
      clientFullName: "Jane Doe",
      supervisionFeeAssessed: "$50.00",
      supervisionFeeArrearaged: true,
      supervisionFeeArrearagedAmount: "$20.00",
      supervisionFeeWaived: "Fees Waived",
      supervisionFeeExemptionType: "SSDB",
      supervisionFeeExemptionExpirDate: "2026-12-31",
      courtCostsPaid: true,
      restitutionAmt: "300",
    }),
  }),
);

function buildForm(featureVariants: Record<string, object>) {
  const rootStore = new RootStore();
  rootStore.userStore = {
    activeFeatureVariants: featureVariants,
  } as UserStore;
  const opportunity = {
    person: { recordId: "us_tn_001" },
    record: {},
  } as unknown as UsTnCompliantReporting2025PolicyOpportunity;
  return new CompliantReportingForm(opportunity, rootStore);
}

describe("CompliantReportingForm fee prefill", () => {
  test("keeps the fee fields from the referral record by default", () => {
    const prefilled = buildForm({}).prefilledDataTransformer();

    expect(prefilled.supervisionFeeAssessed).toBe("$50.00");
    expect(prefilled.courtCostsPaid).toBe(true);
  });

  test("blanks the fee fields and keeps everything else when usTnHideFinesAndFees is on", () => {
    const prefilled = buildForm({
      usTnHideFinesAndFees: {},
    }).prefilledDataTransformer();

    expect(prefilled).toMatchObject(US_TN_CR_BLANK_FEE_FIELDS);
    expect(prefilled.clientFullName).toBe("Jane Doe");
    expect(prefilled.restitutionAmt).toBe("300");
  });
});
