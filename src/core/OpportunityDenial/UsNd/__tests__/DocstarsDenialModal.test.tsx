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
import { parseISO } from "date-fns";
import toast from "react-hot-toast";
import ReactModal from "react-modal";

import { useRootStore } from "../../../../components/StoreProvider";
import { Opportunity } from "../../../../WorkflowsStore";
import { OTHER_KEY } from "../../../../WorkflowsStore/utils";
import { mockOpportunity } from "../../../__tests__/testUtils";
import {
  buildJustificationReasons,
  DocstarsDenialModal,
} from "../DocstarsDenialModal";

jest.mock("../../../../components/StoreProvider");
jest.mock("react-hot-toast");

const mockRootStore = ({
  featureVariants = { usNdWriteToDocstars: {} } as object,
  post = jest.fn(),
  updateOmsSnoozeStatus = jest.fn(),
} = {}) =>
  (useRootStore as jest.Mock).mockReturnValue({
    workflowsStore: {
      currentUserEmail: "mock-email@nd.gov",
      featureVariants,
    },
    userStore: { stateCode: "US_ND" },
    apiStore: { post },
    firestoreStore: {
      updateOmsSnoozeStatus,
    },
  });

let existingEnv: typeof process.env;

beforeEach(() => {
  ReactModal.setAppElement(document.createElement("div"));
  existingEnv = process.env;
  process.env = {
    ...process.env,
    REACT_APP_NEW_BACKEND_API_URL: "TEST_REACT_APP_NEW_BACKEND_API_URL",
  };
});

afterEach(() => {
  jest.resetAllMocks();
  process.env = existingEnv;
});

describe("DocstarsDenialModal", () => {
  it("immediately succeeds if featureVariant isn't set", () => {
    mockRootStore({ featureVariants: {} });

    const onSuccessFn = jest.fn();

    // modal not shown yet
    const modal = render(
      <DocstarsDenialModal
        opportunity={mockOpportunity}
        reasons={[]}
        otherReason=""
        snoozeUntilDate={undefined}
        showModal={false}
        onCloseFn={jest.fn()}
        onSuccessFn={onSuccessFn}
      />
    );
    expect(onSuccessFn).not.toHaveBeenCalled();

    // show modal
    modal.rerender(
      <DocstarsDenialModal
        opportunity={mockOpportunity}
        reasons={[]}
        otherReason=""
        snoozeUntilDate={undefined}
        showModal
        onCloseFn={jest.fn()}
        onSuccessFn={onSuccessFn}
      />
    );
    expect(onSuccessFn).toHaveBeenCalledOnce();
    expect(toast).not.toHaveBeenCalled();
  });

  it("displays information for confirmation", () => {
    mockRootStore();

    render(
      <DocstarsDenialModal
        opportunity={mockOpportunity}
        reasons={[]}
        otherReason=""
        snoozeUntilDate={undefined}
        showModal
        onCloseFn={jest.fn()}
        onSuccessFn={jest.fn()}
      />
    );

    // TODO(#4372) add more comprehensive tests once the confirmation screen is done
    expect(screen.getByText("mock-email@nd.gov")).toBeInTheDocument();
  });

  it("hits the api and writes pending to firestore when Submit is clicked", async () => {
    const apiPost = jest.fn();
    const updateOmsSnoozeStatus = jest.fn();
    mockRootStore({ post: apiPost, updateOmsSnoozeStatus });

    updateOmsSnoozeStatus.mockImplementation(
      (_opp, _email, _state, _pei, _date, _ts, status) => {
        opp.omsSnoozeStatus = status;
      }
    );

    const opp: Opportunity = {
      ...mockOpportunity,
    };

    render(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={["CODE"]}
        otherReason=""
        snoozeUntilDate={parseISO("2025-07-04")}
        showModal
        onCloseFn={jest.fn()}
        onSuccessFn={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("docstars-submit-button"));

    await waitFor(() => {
      expect(updateOmsSnoozeStatus).toHaveBeenCalledWith(
        opp,
        "mock-email@nd.gov",
        "US_ND",
        "123",
        "2025-07-04",
        expect.anything(),
        "PENDING"
      );
      expect(apiPost).toHaveBeenCalledOnce();
      expect(apiPost).toHaveBeenCalledWith(
        "TEST_REACT_APP_NEW_BACKEND_API_URL/workflows/external_request/US_OZ/update_docstars_early_termination_date",
        {
          earlyTerminationDate: "2025-07-04",
          justificationReasons: [{ code: "CODE", description: "Denial Code" }],
          personExternalId: undefined,
          userEmail: "mock-email@nd.gov",
        }
      );
      expect(screen.getByTestId("docstars-loading-screen")).toBeInTheDocument();
    });
  });

  it("writes failure to firestore if the api request fails", async () => {
    const apiPost = jest.fn().mockRejectedValue(new Error("mock error"));
    const updateOmsSnoozeStatus = jest.fn();
    mockRootStore({ post: apiPost, updateOmsSnoozeStatus });

    updateOmsSnoozeStatus.mockImplementation(
      (_opp, _email, _state, _pei, _date, _ts, status) => {
        opp.omsSnoozeStatus = status;
      }
    );

    const opp: Opportunity = {
      ...mockOpportunity,
    };

    render(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={["CODE"]}
        otherReason=""
        snoozeUntilDate={parseISO("2025-07-04")}
        showModal
        onCloseFn={jest.fn()}
        onSuccessFn={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("docstars-submit-button"));

    await waitFor(() => {
      expect(updateOmsSnoozeStatus).toHaveBeenLastCalledWith(
        opp,
        "mock-email@nd.gov",
        "US_ND",
        "123",
        "2025-07-04",
        expect.anything(),
        "FAILURE",
        "mock error"
      );
    });
  });

  it("switches to failure mode if firestore says so", async () => {
    mockRootStore();

    const opp: Opportunity = {
      ...mockOpportunity,
    };

    render(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={["CODE"]}
        otherReason=""
        snoozeUntilDate={parseISO("2025-07-04")}
        showModal
        onCloseFn={jest.fn()}
        onSuccessFn={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("docstars-submit-button"));
    opp.omsSnoozeStatus = "FAILURE";

    await waitFor(() => {
      expect(screen.getByTestId("docstars-failure-screen")).toBeInTheDocument();
    });
  });

  it("sends a toast and hits the callback when the submission succeeds", async () => {
    mockRootStore();

    const opp: Opportunity = {
      ...mockOpportunity,
    };

    const onSuccessFn = jest.fn();

    render(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={[]}
        otherReason=""
        snoozeUntilDate={undefined}
        showModal
        onCloseFn={jest.fn()}
        onSuccessFn={onSuccessFn}
      />
    );

    fireEvent.click(screen.getByTestId("docstars-submit-button"));
    opp.omsSnoozeStatus = "SUCCESS";

    await waitFor(() => {
      expect(onSuccessFn).toHaveBeenCalledOnce();
      expect(toast).toHaveBeenCalledOnceWith(
        "Note successfully synced to DOCSTARS"
      );
    });
  });

  it("starts fresh even if there's a firestore status recorded", () => {
    mockRootStore();

    const opp: Opportunity = { ...mockOpportunity, omsSnoozeStatus: "SUCCESS" };

    render(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={[]}
        otherReason=""
        snoozeUntilDate={undefined}
        showModal
        onCloseFn={jest.fn()}
        onSuccessFn={jest.fn()}
      />
    );

    expect(
      screen.getByTestId("docstars-confirmation-screen")
    ).toBeInTheDocument();
  });

  it("resets state if the modal closes and reopens", async () => {
    mockRootStore();

    const opp: Opportunity = {
      ...mockOpportunity,
    };

    const modal = render(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={[]}
        otherReason=""
        snoozeUntilDate={undefined}
        showModal
        onCloseFn={jest.fn()}
        onSuccessFn={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("docstars-submit-button"));
    opp.omsSnoozeStatus = "PENDING";

    await waitFor(() => {
      expect(screen.getByTestId("docstars-loading-screen")).toBeInTheDocument();
    });

    // hide modal momentarily
    modal.rerender(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={[]}
        otherReason=""
        snoozeUntilDate={undefined}
        showModal={false}
        onCloseFn={jest.fn()}
        onSuccessFn={jest.fn()}
      />
    );

    // show modal
    modal.rerender(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={[]}
        otherReason=""
        snoozeUntilDate={undefined}
        showModal
        onCloseFn={jest.fn()}
        onSuccessFn={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("docstars-confirmation-screen")
      ).toBeInTheDocument();
    });
  });

  describe("buildJustificationReasons", () => {
    it("handles empty reasons list", () => {
      const out = buildJustificationReasons(
        {
          denialReasonsMap: {
            CODE: "Denial Code",
            "CODE 2": "Denial Code 2",
            [OTHER_KEY]: "Other Key",
          },
        } as unknown as Opportunity,
        [],
        ""
      );

      expect(out).toStrictEqual([]);
    });

    it("uses otherKey", () => {
      const out = buildJustificationReasons(
        {
          denialReasonsMap: {
            CODE: "Denial Code",
            "CODE 2": "Denial Code 2",
            [OTHER_KEY]: "Other Key",
          },
        } as unknown as Opportunity,
        [OTHER_KEY],
        "Other reason"
      );

      expect(out).toStrictEqual([
        { code: "Other", description: "Other reason" },
      ]);
    });

    it("handles multiple codes", () => {
      const out = buildJustificationReasons(
        {
          denialReasonsMap: {
            CODE: "Denial Code",
            "CODE 2": "Denial Code 2",
            [OTHER_KEY]: "Other Key",
          },
        } as unknown as Opportunity,
        ["CODE", OTHER_KEY],
        "Other reason"
      );

      expect(out).toStrictEqual([
        { code: "CODE", description: "Denial Code" },
        { code: "Other", description: "Other reason" },
      ]);
    });
  });
});