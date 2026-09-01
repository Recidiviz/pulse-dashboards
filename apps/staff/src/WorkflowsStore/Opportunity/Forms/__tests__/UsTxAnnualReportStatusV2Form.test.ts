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

import { deleteField, writeBatch } from "firebase/firestore";
import { configure } from "mobx";

import { RootStore } from "../../../../RootStore";
import UserStore from "../../../../RootStore/UserStore";
import { Client } from "../../../Client";
import { UsTxAnnualReportStatusV2Opportunity } from "../../UsTx/UsTxAnnualReportStatusV2Opportunity/UsTxAnnualReportStatusV2Opportunity";
import { UsTxAnnualReportStatusV2Form } from "../UsTxAnnualReportStatusV2Form/UsTxAnnualReportStatusV2Form";

// This override also lives on UsTxEarlyReleaseFromSupervisionV2Form, which shares
// identical updateDraftData logic — this test exercises the ARS V2 form as a
// representative case. It is intentionally scoped to the V2 opportunities only.

vi.mock("../../../subscriptions");
vi.mock("firebase/firestore");

let rootStore: RootStore;
let opp: UsTxAnnualReportStatusV2Opportunity;
let form: UsTxAnnualReportStatusV2Form;

function createTestUnit(tdcjNumber = "ARS001") {
  rootStore = new RootStore();
  rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  rootStore.userStore = {
    isRecidivizUser: false,
    activeFeatureVariants: {},
  } as UserStore;

  const person = {
    rootStore,
    recordId: "us_tx_001",
    pseudonymizedId: "pseudo1",
    displayId: "d1",
    displayName: "Test Person",
    assignedStaffFullName: "Jane Doe",
  } as Client;

  opp = new UsTxAnnualReportStatusV2Opportunity(person, {
    stateCode: "US_TX",
    externalId: "ARS001",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {},
    ineligibleCriteria: {},
    formInformation: { tdcjNumber },
    metadata: {},
  });

  form = opp.form;
}

beforeEach(() => {
  vi.resetAllMocks();
  configure({ safeDescriptors: false });
  createTestUnit();
  vi.mocked(writeBatch).mockImplementation(
    () =>
      ({
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn(),
      }) as any,
  );
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

describe("updateDraftData for a prepopulated field", () => {
  test("writes to firestore when the value differs from the prepopulated value", async () => {
    vi.spyOn(rootStore.firestoreStore, "updateForm");

    await form.updateDraftData("officerName", "Someone Else");

    expect(rootStore.firestoreStore.updateForm).toHaveBeenCalledWith(
      opp.person.recordId,
      expect.objectContaining({
        data: { officerName: "Someone Else" },
      }),
      form.formId,
    );
  });

  test("does not write to firestore when the value matches the prepopulated value and there is no prior draft", async () => {
    vi.spyOn(rootStore.firestoreStore, "updateForm");

    await form.updateDraftData("officerName", "Jane Doe");

    expect(rootStore.firestoreStore.updateForm).not.toHaveBeenCalled();
  });

  test.each(["jane doe", "JANE DOE", "Jane Doe ", " jane doe "])(
    "does not write to firestore for a case/whitespace-insensitive match: %j",
    async (value) => {
      vi.spyOn(rootStore.firestoreStore, "updateForm");

      await form.updateDraftData("officerName", value);

      expect(rootStore.firestoreStore.updateForm).not.toHaveBeenCalled();
    },
  );

  test("clears an existing draft when the user reverts the field back to a case/whitespace variant of the prepopulated value", async () => {
    vi.spyOn(form, "draftData", "get").mockReturnValue({
      officerName: "Someone Else",
    });
    vi.spyOn(rootStore.firestoreStore, "updateForm");

    await form.updateDraftData("officerName", "jane doe ");

    expect(rootStore.firestoreStore.updateForm).toHaveBeenCalledWith(
      opp.person.recordId,
      expect.objectContaining({
        data: { officerName: deleteField() },
        fieldAuthors: { officerName: deleteField() },
      }),
      form.formId,
    );
  });

  test("clears an existing draft when the user reverts the field back to the prepopulated value", async () => {
    vi.spyOn(form, "draftData", "get").mockReturnValue({
      officerName: "Someone Else",
    });
    vi.spyOn(rootStore.firestoreStore, "updateForm");

    await form.updateDraftData("officerName", "Jane Doe");

    expect(rootStore.firestoreStore.updateForm).toHaveBeenCalledWith(
      opp.person.recordId,
      expect.objectContaining({
        data: { officerName: deleteField() },
        fieldAuthors: { officerName: deleteField() },
      }),
      form.formId,
    );
  });

  test("writes normally for a field with no prepopulated value", async () => {
    vi.spyOn(rootStore.firestoreStore, "updateForm");

    await form.updateDraftData("comment1", "some remarks");

    expect(rootStore.firestoreStore.updateForm).toHaveBeenCalledWith(
      opp.person.recordId,
      expect.objectContaining({ data: { comment1: "some remarks" } }),
      form.formId,
    );
  });
});
