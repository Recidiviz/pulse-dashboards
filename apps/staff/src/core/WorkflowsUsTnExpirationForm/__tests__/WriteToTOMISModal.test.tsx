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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DocumentData, Timestamp, writeBatch } from "firebase/firestore";
import { configure } from "mobx";
import ReactModal from "react-modal";
import tk from "timekeeper";
import { setTimeout } from "timers/promises";

import { CombinedUserRecord } from "../../../FirestoreStore";
import { RootStore } from "../../../RootStore";
import { Client, UsTnExpirationOpportunity } from "../../../WorkflowsStore";
import {
  UsTnExpirationEligibleClientRecord,
  UsTnExpirationReferralRecordFixture,
  usTnUserRecord,
} from "../../../WorkflowsStore/Opportunity/UsTn/__fixtures__";
import { DocumentSubscription } from "../../../WorkflowsStore/subscriptions";
import {
  createContactNoteRequestBody,
  WriteToTOMISModal,
} from "../WriteToTOMISModal";

vi.mock("firebase/firestore");
vi.mock("../../../WorkflowsStore/subscriptions");

let opp: UsTnExpirationOpportunity;
let client: Client;
let root: RootStore;
let updatesSub: DocumentSubscription<any>;

function createTestUnit(
  clientRecord: typeof UsTnExpirationEligibleClientRecord,
  userRecord: CombinedUserRecord,
  opportunityRecord: DocumentData,
) {
  root = new RootStore();
  root.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  vi.spyOn(
    root.workflowsRootStore.opportunityConfigurationStore,
    "enabledOpportunityTypes",
    "get",
  ).mockReturnValue(["usTnExpiration"]);
  vi.spyOn(root.workflowsStore, "currentUserEmail", "get").mockReturnValue(
    "test-officer@example.com",
  );
  vi.spyOn(root.workflowsStore, "user", "get").mockReturnValue(userRecord);
  vi.spyOn(root.userStore, "stateCode", "get").mockReturnValue("US_TN");
  client = new Client(clientRecord, root);

  opp = new UsTnExpirationOpportunity(client, opportunityRecord);
}

beforeEach(() => {
  ReactModal.setAppElement(document.createElement("div"));
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  vi.mocked(writeBatch).mockImplementation(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(),
  }));
});

afterEach(async () => {
  // this prevents modal async close actions from erroring during teardown
  await setTimeout(300);
});

describe("WriteToTOMISModal", () => {
  let submitButton: HTMLElement;
  beforeEach(() => {
    createTestUnit(
      UsTnExpirationEligibleClientRecord,
      usTnUserRecord,
      UsTnExpirationReferralRecordFixture,
    );

    updatesSub = opp.updatesSubscription;
    updatesSub.hydrationState = { status: "hydrated" };

    render(
      <WriteToTOMISModal
        showModal
        onCloseFn={vi.fn()}
        paginatedNote={[
          ["page 1, line 1", "page 1, line 2"],
          ["page 2, line 1"],
        ]}
        opportunity={opp}
        showSubmitPage
      />,
    );
    submitButton = screen.getByRole("button", {
      name: "Submit note to eTomis",
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
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
      screen.getByRole("button", { name: "Submit note to eTomis" }),
    ).toBeInTheDocument();
  });

  test("renders loading", async () => {
    updatesSub.data = {
      contactNote: {
        status: "PENDING",
      },
    };

    await waitFor(() => {
      expect(
        screen.getByText("Submitting notes to TOMIS..."),
      ).toBeInTheDocument();

      expect(screen.queryByText("Betty Rubble")).not.toBeInTheDocument();
    });
  });

  test("renders success", async () => {
    updatesSub.data = {
      contactNote: {
        status: "SUCCESS",
      },
    };

    await waitFor(() => {
      expect(
        screen.getByText("2-page TEPE note successfully submitted"),
      ).toBeInTheDocument();
    });
  });

  describe("failure", () => {
    beforeEach(() => {
      updatesSub.data = {
        contactNote: {
          status: "FAILURE",
        },
      };
    });

    test("renders", async () => {
      expectPreviewContents();

      await waitFor(() => {
        expect(
          screen.getByText("Note did not submit to TOMIS"),
        ).toBeInTheDocument();
      });
    });

    test("copies note", async () => {
      vi.spyOn(opp, "setCompletedIfEligible");

      await waitFor(() => {
        const copyButton = screen.getByRole("button", { name: "Copy page 1" });
        expect(copyButton).toBeInTheDocument();

        expect(opp.setCompletedIfEligible).not.toHaveBeenCalled();
        fireEvent.click(copyButton);

        expect(opp.setCompletedIfEligible).toHaveBeenCalled();
      });
    });
  });

  test("submit success", async () => {
    vi.spyOn(opp, "setCompletedIfEligible");
    vi.spyOn(root.apiStore.client, "post").mockResolvedValue("success");
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
    vi.spyOn(root.apiStore.client, "post").mockImplementation((...args) => {
      throw Error("test error");
    });
    vi.spyOn(root.firestoreStore, "updateOpportunity");

    expect(submitButton).toBeInTheDocument();
    fireEvent.click(submitButton);
    await waitFor(() =>
      expect(root.firestoreStore.updateOpportunity).toHaveBeenCalledWith(opp, {
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
      }),
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
      new Date(2023, 2, 10),
    );

    expect(contactNoteRequestBody).toMatchInlineSnapshot(`
      {
        "contactNote": {
          "1": [
            "page 1, line 1",
            "page 1, line 2",
          ],
          "2": [
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
