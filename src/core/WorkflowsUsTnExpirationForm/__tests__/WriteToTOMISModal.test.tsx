// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { configure } from "mobx";
import ReactModal from "react-modal";
import tk from "timekeeper";

import { CombinedUserRecord } from "../../../FirestoreStore";
import { RootStore } from "../../../RootStore";
import { Client, UsTnExpirationOpportunity } from "../../../WorkflowsStore";
import {
  UsTnExpirationEligibleClientRecord,
  UsTnExpirationReferralRecordFixture,
  usTnUserRecord,
} from "../../../WorkflowsStore/Opportunity/__fixtures__";
import { DocumentSubscription } from "../../../WorkflowsStore/subscriptions";
import {
  createContactNoteRequestBody,
  WriteToTOMISModal,
} from "../WriteToTOMISModal";

jest.mock("firebase/firestore");
jest.mock("../../../WorkflowsStore/subscriptions");

let opp: UsTnExpirationOpportunity;
let client: Client;
let root: RootStore;
let referralSub: DocumentSubscription<any>;
let updatesSub: DocumentSubscription<any>;

function createTestUnit(
  clientRecord: typeof UsTnExpirationEligibleClientRecord,
  userRecord: CombinedUserRecord
) {
  root = new RootStore();
  jest
    .spyOn(root.workflowsStore, "opportunityTypes", "get")
    .mockReturnValue(["usTnExpiration"]);
  jest
    .spyOn(root.workflowsStore, "currentUserEmail", "get")
    .mockReturnValue("test-officer@example.com");
  jest.spyOn(root.workflowsStore, "user", "get").mockReturnValue(userRecord);
  jest.spyOn(root.userStore, "stateCode", "get").mockReturnValue("US_TN");
  client = new Client(clientRecord, root);

  const maybeOpportunity = client.potentialOpportunities.usTnExpiration;

  if (maybeOpportunity === undefined) {
    throw new Error("Unable to create opportunity instance");
  }

  opp = maybeOpportunity;
}

beforeEach(() => {
  ReactModal.setAppElement(document.createElement("div"));
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
});

describe("WriteToTOMISModal", () => {
  let submitButton: HTMLElement;
  beforeEach(() => {
    createTestUnit(UsTnExpirationEligibleClientRecord, usTnUserRecord);
    referralSub = opp.referralSubscription;
    referralSub.isLoading = false;
    referralSub.data = UsTnExpirationReferralRecordFixture;

    updatesSub = opp.updatesSubscription;
    updatesSub.isLoading = false;

    render(
      <WriteToTOMISModal
        showModal
        onCloseFn={jest.fn()}
        paginatedNote={[
          ["page 1, line 1", "page 1, line 2"],
          ["page 2, line 1"],
        ]}
        opportunity={opp}
        showSubmitPage
      />
    );
    submitButton = screen.getByRole("button", {
      name: "Submit note to eTomis",
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  function expectPreviewContents() {
    expect(screen.getByText("Betty Rubble")).toBeInTheDocument();
    expect(screen.getByText("001")).toBeInTheDocument();
    expect(screen.getByText("Contact Types: TEPE, VRRE")).toBeInTheDocument();
    const previewBoxes = screen.getAllByRole("article");
    expect(previewBoxes).toHaveLength(3); // one large + two small
  }

  test("renders preview", () => {
    expectPreviewContents();
    expect(
      screen.getByRole("button", { name: "Submit note to eTomis" })
    ).toBeInTheDocument();
  });

  test("renders loading", () => {
    updatesSub.data = {
      contactNote: {
        status: "PENDING",
      },
    };

    expect(
      screen.getByText("Submitting notes to TOMIS...")
    ).toBeInTheDocument();

    expect(screen.queryByText("Betty Rubble")).not.toBeInTheDocument();
  });

  test("renders success", () => {
    updatesSub.data = {
      contactNote: {
        status: "SUCCESS",
      },
    };

    expect(
      screen.getByText("2-page TEPE note successfully submitted")
    ).toBeInTheDocument();
  });

  describe("failure", () => {
    beforeEach(() => {
      updatesSub.data = {
        contactNote: {
          status: "FAILURE",
        },
      };
    });

    test("renders", () => {
      expectPreviewContents();

      expect(
        screen.getByText("Note did not submit to TOMIS")
      ).toBeInTheDocument();
    });

    test("copies note", () => {
      jest.spyOn(opp, "setCompletedIfEligible");
      const copyButton = screen.getByRole("button", { name: "Copy page 1" });
      expect(copyButton).toBeInTheDocument();

      expect(opp.setCompletedIfEligible).not.toHaveBeenCalled();
      fireEvent.click(copyButton);

      expect(opp.setCompletedIfEligible).toHaveBeenCalled();
    });
  });

  test("submit success", async () => {
    jest.spyOn(opp, "setCompletedIfEligible");
    jest.spyOn(root.apiStore, "post").mockResolvedValue("success");
    expect(submitButton).toBeInTheDocument();

    expect(opp.setCompletedIfEligible).not.toHaveBeenCalled();
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(opp.setCompletedIfEligible).toHaveBeenCalled();
    });
  });

  test("submit failure", async () => {
    const now = new Date(2023, 2, 10);
    tk.freeze(now);
    jest.spyOn(root.apiStore, "post").mockImplementation((path, body) => {
      throw Error("test error");
    });
    jest.spyOn(root.firestoreStore, "updateOpportunity");

    expect(submitButton).toBeInTheDocument();
    fireEvent.click(submitButton);
    await waitFor(() =>
      expect(root.firestoreStore.updateOpportunity).toHaveBeenCalledWith(
        "usTnExpiration",
        "us_xx_001",
        {
          contactNote: {
            status: "FAILURE",
            submitted: {
              by: "test-officer@example.com",
              date: Timestamp.fromDate(now),
            },
            note: {
              1: ["page 1, line 1", "page 1, line 2"],
              2: ["page 2, line 1"],
            },
            noteStatus: {},
            error: "test error",
          },
        }
      )
    );
  });

  test("createContactNoteRequestBody", () => {
    const contactNoteRequestBody = createContactNoteRequestBody(
      opp,
      client,
      {
        1: ["page 1, line 1", "page 1, line 2"],
        2: ["page 2, line 1"],
      },
      new Date(2023, 2, 10)
    );

    expect(contactNoteRequestBody).toMatchInlineSnapshot(`
      Object {
        "contactNote": Object {
          "1": Array [
            "page 1, line 1",
            "page 1, line 2",
          ],
          "2": Array [
            "page 2, line 1",
          ],
        },
        "contactNoteDateTime": 2023-03-10T00:00:00.000Z,
        "personExternalId": "001",
        "staffId": "OFFICER1",
        "votersRightsCode": "VRRE",
      }
    `);
  });
});
