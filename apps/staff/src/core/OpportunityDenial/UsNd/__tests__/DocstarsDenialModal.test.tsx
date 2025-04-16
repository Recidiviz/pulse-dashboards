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
import { parseISO } from "date-fns";
import toast from "react-hot-toast";
import ReactModal from "react-modal";
import { setTimeout } from "timers/promises";
import { Mock } from "vitest";

import { useRootStore } from "../../../../components/StoreProvider";
import { Opportunity } from "../../../../WorkflowsStore";
import { OTHER_KEY } from "../../../../WorkflowsStore/utils";
import { mockOpportunity } from "../../../__tests__/testUtils";
import { OpportunityStatusUpdateToast } from "../../../opportunityStatusUpdateToast";
import {
  buildJustificationReasons,
  DocstarsDenialModal,
} from "../DocstarsDenialModal";

vi.mock("../../../../components/StoreProvider");
vi.mock("react-hot-toast");

const mockRootStore = () => {
  const apiPost = vi.fn();
  const updateOmsSnoozeStatus = vi.fn();
  updateOmsSnoozeStatus.mockImplementation(
    (opp, _email, _state, _pei, _date, _ts, status) => {
      opp.omsSnoozeStatus = status;
    },
  );

  (useRootStore as Mock).mockReturnValue({
    workflowsStore: { currentUserEmail: "mock-email@nd.gov" },
    userStore: { stateCode: "US_ND" },
    apiStore: { post: apiPost },
    firestoreStore: {
      updateOmsSnoozeStatus,
    },
  });

  return { apiPost, updateOmsSnoozeStatus };
};

beforeEach(() => {
  ReactModal.setAppElement(document.createElement("div"));
  vi.stubEnv("VITE_NEW_BACKEND_API_URL", "TEST_VITE_NEW_BACKEND_API_URL");
});

afterEach(async () => {
  // this prevents modal async close actions from erroring during teardown
  await setTimeout(300);
});

describe("DocstarsDenialModal", () => {
  it("displays information for confirmation", () => {
    mockRootStore();

    render(
      <DocstarsDenialModal
        opportunity={mockOpportunity}
        reasons={[]}
        otherReason=""
        snoozeUntilDate={undefined}
        showModal
        onCloseFn={vi.fn()}
        onSuccessFn={vi.fn()}
        onAlternativeSubmissionFn={vi.fn()}
      />,
    );

    // TODO(#4372) add more comprehensive tests once the confirmation screen is done
    expect(screen.getByText("mock-email@nd.gov")).toBeInTheDocument();
  });

  it("hits the api and writes pending to firestore when Submit is clicked", async () => {
    const { apiPost, updateOmsSnoozeStatus } = mockRootStore();

    updateOmsSnoozeStatus.mockImplementation(
      (_opp, _email, _state, _pei, _date, _ts, status) => {
        opp.omsSnoozeStatus = status;
      },
    );

    const opp: Opportunity = {
      ...mockOpportunity,
    };

    const { rerender } = render(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={["CODE"]}
        otherReason=""
        snoozeUntilDate={parseISO("2025-07-04")}
        showModal
        onCloseFn={vi.fn()}
        onSuccessFn={vi.fn()}
        onAlternativeSubmissionFn={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("checkbox-acknowledgement-checkbox"));
    fireEvent.click(screen.getByTestId("docstars-submit-button"));

    rerender(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={["CODE"]}
        otherReason=""
        snoozeUntilDate={parseISO("2025-07-04")}
        showModal
        onCloseFn={vi.fn()}
        onSuccessFn={vi.fn()}
        onAlternativeSubmissionFn={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(updateOmsSnoozeStatus).toHaveBeenCalledWith(
        opp,
        "mock-email@nd.gov",
        "US_ND",
        "123",
        "2025-07-04",
        expect.anything(),
        "PENDING",
      );
      expect(apiPost).toHaveBeenCalledOnce();
      expect(apiPost).toHaveBeenCalledWith(
        "TEST_VITE_NEW_BACKEND_API_URL/workflows/external_request/US_OZ/update_docstars_early_termination_date",
        {
          earlyTerminationDate: "2025-07-04",
          justificationReasons: [{ code: "CODE", description: "Denial Code" }],
          personExternalId: undefined,
          userEmail: "mock-email@nd.gov",
        },
      );
      expect(screen.getByTestId("docstars-loading-screen")).toBeInTheDocument();
    });
  });

  it("writes failure to firestore if the api request fails", async () => {
    const { apiPost, updateOmsSnoozeStatus } = mockRootStore();

    apiPost.mockRejectedValue(new Error("mock error"));

    const opp: Opportunity = {
      ...mockOpportunity,
    };

    const { rerender } = render(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={["CODE"]}
        otherReason=""
        snoozeUntilDate={parseISO("2025-07-04")}
        showModal
        onCloseFn={vi.fn()}
        onSuccessFn={vi.fn()}
        onAlternativeSubmissionFn={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("checkbox-acknowledgement-checkbox"));
    fireEvent.click(screen.getByTestId("docstars-submit-button"));

    rerender(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={["CODE"]}
        otherReason=""
        snoozeUntilDate={parseISO("2025-07-04")}
        showModal
        onCloseFn={vi.fn()}
        onSuccessFn={vi.fn()}
        onAlternativeSubmissionFn={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(updateOmsSnoozeStatus).toHaveBeenLastCalledWith(
        opp,
        "mock-email@nd.gov",
        "US_ND",
        "123",
        "2025-07-04",
        expect.anything(),
        "FAILURE",
        "mock error",
      );
    });
  });

  it("switches to failure mode if firestore says so", async () => {
    mockRootStore();

    const opp: Opportunity = {
      ...mockOpportunity,
    };

    const { rerender } = render(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={["CODE"]}
        otherReason=""
        snoozeUntilDate={parseISO("2025-07-04")}
        showModal
        onCloseFn={vi.fn()}
        onSuccessFn={vi.fn()}
        onAlternativeSubmissionFn={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("checkbox-acknowledgement-checkbox"));
    fireEvent.click(screen.getByTestId("docstars-submit-button"));

    rerender(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={["CODE"]}
        otherReason=""
        snoozeUntilDate={parseISO("2025-07-04")}
        showModal
        onCloseFn={vi.fn()}
        onSuccessFn={vi.fn()}
        onAlternativeSubmissionFn={vi.fn()}
      />,
    );

    opp.omsSnoozeStatus = "FAILURE";

    rerender(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={["CODE"]}
        otherReason=""
        snoozeUntilDate={parseISO("2025-07-04")}
        showModal
        onCloseFn={vi.fn()}
        onSuccessFn={vi.fn()}
        onAlternativeSubmissionFn={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("docstars-failure-screen")).toBeInTheDocument();
    });
  });

  it("sends a toast and hits the callback when the submission succeeds", async () => {
    mockRootStore();

    const opp: Opportunity = {
      ...mockOpportunity,
    };

    const onSuccessFn = vi.fn();

    const { rerender } = render(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={[]}
        otherReason=""
        snoozeUntilDate={undefined}
        showModal
        onCloseFn={vi.fn()}
        onSuccessFn={onSuccessFn}
        onAlternativeSubmissionFn={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("checkbox-acknowledgement-checkbox"));
    fireEvent.click(screen.getByTestId("docstars-submit-button"));

    rerender(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={[]}
        otherReason=""
        snoozeUntilDate={undefined}
        showModal
        onCloseFn={vi.fn()}
        onSuccessFn={onSuccessFn}
        onAlternativeSubmissionFn={vi.fn()}
      />,
    );

    opp.omsSnoozeStatus = "SUCCESS";

    rerender(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={[]}
        otherReason=""
        snoozeUntilDate={undefined}
        showModal
        onCloseFn={vi.fn()}
        onSuccessFn={onSuccessFn}
        onAlternativeSubmissionFn={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(onSuccessFn).toHaveBeenCalledOnce();
      expect(toast).toHaveBeenCalledExactlyOnceWith(
        <OpportunityStatusUpdateToast toastText="Note successfully synced to DOCSTARS" />,
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
        onCloseFn={vi.fn()}
        onSuccessFn={vi.fn()}
        onAlternativeSubmissionFn={vi.fn()}
      />,
    );

    expect(
      screen.getByTestId("docstars-confirmation-screen"),
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
        onCloseFn={vi.fn()}
        onSuccessFn={vi.fn()}
        onAlternativeSubmissionFn={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("checkbox-acknowledgement-checkbox"));
    fireEvent.click(screen.getByTestId("docstars-submit-button"));

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
        onCloseFn={vi.fn()}
        onSuccessFn={vi.fn()}
        onAlternativeSubmissionFn={vi.fn()}
      />,
    );

    // show modal
    modal.rerender(
      <DocstarsDenialModal
        opportunity={opp}
        reasons={[]}
        otherReason=""
        snoozeUntilDate={undefined}
        showModal
        onCloseFn={vi.fn()}
        onSuccessFn={vi.fn()}
        onAlternativeSubmissionFn={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("docstars-confirmation-screen"),
      ).toBeInTheDocument();
    });
  });

  describe("buildJustificationReasons", () => {
    it("handles empty reasons list", () => {
      const out = buildJustificationReasons(
        {
          config: {
            denialReasons: {
              CODE: "Denial Code",
              "CODE 2": "Denial Code 2",
              [OTHER_KEY]: "Other Key",
            },
          },
        } as unknown as Opportunity,
        [],
        "",
      );

      expect(out).toStrictEqual([]);
    });

    it("uses otherKey", () => {
      const out = buildJustificationReasons(
        {
          config: {
            denialReasons: {
              CODE: "Denial Code",
              "CODE 2": "Denial Code 2",
              [OTHER_KEY]: "Other Key",
            },
          },
        } as unknown as Opportunity,
        [OTHER_KEY],
        "Other reason",
      );

      expect(out).toStrictEqual([
        { code: "Other", description: "Other reason" },
      ]);
    });

    it("handles multiple codes", () => {
      const out = buildJustificationReasons(
        {
          config: {
            denialReasons: {
              CODE: "Denial Code",
              "CODE 2": "Denial Code 2",
              [OTHER_KEY]: "Other Key",
            },
          },
        } as unknown as Opportunity,
        ["CODE", OTHER_KEY],
        "Other reason",
      );

      expect(out).toStrictEqual([
        { code: "CODE", description: "Denial Code" },
        { code: "Other", description: "Other reason" },
      ]);
    });
  });
});
