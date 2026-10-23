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

import { RootStore } from "../../../RootStore";
import { ActiveFeatureVariantRecord } from "../../../RootStore/types";
import UserStore from "../../../RootStore/UserStore";
import { Client } from "../../Client";
import { UsTxAnnualReportStatusV2Opportunity } from "./UsTxAnnualReportStatusV2Opportunity/UsTxAnnualReportStatusV2Opportunity";
import { UsTxEarlyReleaseFromSupervisionV2Opportunity } from "./UsTxEarlyReleaseFromSupervisionV2Opportunity/UsTxEarlyReleaseFromSupervisionV2Opportunity";

vi.mock("../../subscriptions");
vi.mock("firebase/firestore");

function createClient(activeFeatureVariants: ActiveFeatureVariantRecord) {
  const rootStore = new RootStore();
  rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  rootStore.userStore = {
    isRecidivizUser: false,
    activeFeatureVariants,
  } as UserStore;

  return {
    rootStore,
    recordId: "us_tx_001",
    pseudonymizedId: "pseudo1",
    displayId: "d1",
    displayName: "Test Person",
  } as Client;
}

const record = {
  stateCode: "US_TX",
  externalId: "001",
  opportunityId: "2026-03-05",
  isEligible: true,
  isAlmostEligible: false,
  eligibleCriteria: {},
  ineligibleCriteria: {},
  formInformation: {},
  metadata: {},
};

describe.each([
  ["usTxAnnualReportStatusV2", UsTxAnnualReportStatusV2Opportunity],
  [
    "usTxEarlyReleaseFromSupervisionV2",
    UsTxEarlyReleaseFromSupervisionV2Opportunity,
  ],
] as const)("%s opportunityId", (type, OpportunityClass) => {
  test("uses the record's opportunityId with usTxArsErsV2OpportunityId", () => {
    const opp = new OpportunityClass(
      createClient({ usTxArsErsV2OpportunityId: {} }),
      record,
    );

    expect(opp.opportunityId).toBe("2026-03-05");
    expect(opp.firestoreUpdateDocId).toBe(`${type}_2026-03-05`);
  });

  test("ignores the record's opportunityId without usTxArsErsV2OpportunityId", () => {
    const opp = new OpportunityClass(createClient({}), record);

    expect(opp.opportunityId).toBeUndefined();
    expect(opp.firestoreUpdateDocId).toBe(type);
  });
});

describe.each([
  ["usTxAnnualReportStatusV2", UsTxAnnualReportStatusV2Opportunity],
  [
    "usTxEarlyReleaseFromSupervisionV2",
    UsTxEarlyReleaseFromSupervisionV2Opportunity,
  ],
] as const)("%s caseNoteHeaders", (_type, OpportunityClass) => {
  const note = {
    noteTitle: "Supervision",
    noteBody: "$21.00",
    eventDate: "2026-06-03",
  };

  test("lists Current Fees before Most Recent Payments when fees are present", () => {
    const opp = new OpportunityClass(createClient({}), {
      ...record,
      caseNotes: {
        "Most Recent Payments": [note],
        "Current Fees": [note],
      },
    });

    expect(opp.caseNoteHeaders).toEqual([
      "Current Fees",
      "Most Recent Payments",
    ]);
  });

  test("returns no headers when fees are absent", () => {
    const opp = new OpportunityClass(createClient({}), {
      ...record,
      caseNotes: { "Other Notes": [note] },
    });

    expect(opp.caseNoteHeaders).toEqual([]);
  });
});
