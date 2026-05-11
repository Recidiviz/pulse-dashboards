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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { parseISO } from "date-fns";
import toast from "react-hot-toast";
import ReactModal from "react-modal";
import { setTimeout } from "timers/promises";
import { Mock } from "vitest";

import { useRootStore } from "../../../../components/StoreProvider";
import { Client, Opportunity } from "../../../../WorkflowsStore";
import { mockOpportunity } from "../../../__tests__/testUtils";
import { TomisDenialModal } from "../TomisDenialModal";

vi.mock("../../../../components/StoreProvider");
vi.mock("react-hot-toast");

const mockRootStore = () => {
  const doc = vi.fn().mockReturnValue("mock-doc-ref");
  const postExternalRequest = vi.fn();
  const updateClientUpdatesV2Document = vi.fn().mockResolvedValue(undefined);

  (useRootStore as Mock).mockReturnValue({
    workflowsStore: {
      currentUserEmail: "mock-email@tn.gov",
      user: { info: { id: "STAFF123" } },
    },
    userStore: { stateCode: "US_TN" },
    apiStore: { postExternalRequest },
    firestoreStore: {
      doc,
      updateClientUpdatesV2Document,
    },
  });

  return { doc, postExternalRequest, updateClientUpdatesV2Document };
};

const tomisMockOpportunity = (): Opportunity => ({
  ...mockOpportunity,
  firestoreUpdateDocId: "usTnCompliantReporting2025Policy",
  person: {
    ...mockOpportunity.person,
    stateCode: "US_TN",
    externalId: "00431278",
    displayPreferredName: "Betty Weaver",
  } as Client,
  config: {
    ...mockOpportunity.config,
    denialReasons: {
      DECF: "DECF: Denied, No Effort to Pay Fine and Costs",
      DEIO: "DEIO: Denied for CR",
      DEIR: "DEIR: Denied, Failure to Report as Instructed",
    },
  },
});

const defaultProps = {
  reasons: ["DECF", "DEIO"],
  otherReason: "",
  snoozeUntilDate: parseISO("2026-07-04"),
  showModal: true,
  onCloseFn: vi.fn(),
  onSuccessFn: vi.fn(),
  onAlternativeSubmissionFn: vi.fn(),
};

beforeEach(() => {
  ReactModal.setAppElement(document.createElement("div"));
  vi.stubEnv("VITE_NEW_BACKEND_API_URL", "TEST_API_URL");
});

afterEach(async () => {
  await setTimeout(300);
});

describe("TomisDenialModal", () => {
  it("displays review screen with denial codes and comment textarea", () => {
    mockRootStore();
    const opp = tomisMockOpportunity();

    render(<TomisDenialModal opportunity={opp} {...defaultProps} />);

    expect(screen.getByTestId("tomis-confirmation-screen")).toBeInTheDocument();
    expect(
      screen.getByText(/Compliant Reporting Denial Codes/),
    ).toBeInTheDocument();
    expect(screen.getByText(/DECF/)).toBeInTheDocument();
    expect(screen.getByText(/DEIO/)).toBeInTheDocument();
    expect(
      screen.getByTestId("character-count-text-field"),
    ).toBeInTheDocument();
  });

  it("has submit button disabled when comment is empty", () => {
    mockRootStore();
    const opp = tomisMockOpportunity();

    render(<TomisDenialModal opportunity={opp} {...defaultProps} />);

    const submitButton = screen.getByTestId("tomis-submit-button");
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when comment meets minimum length", () => {
    mockRootStore();
    const opp = tomisMockOpportunity();

    render(<TomisDenialModal opportunity={opp} {...defaultProps} />);

    const input = screen.getByTestId("character-count-text-field");
    fireEvent.change(input, { target: { value: "Valid comment text" } });

    const submitButton = screen.getByTestId("tomis-submit-button");
    expect(submitButton).not.toBeDisabled();
  });

  it("makes single API call and pre-creates the stable status doc", async () => {
    const { doc, postExternalRequest, updateClientUpdatesV2Document } =
      mockRootStore();
    postExternalRequest.mockResolvedValue({});
    const opp = tomisMockOpportunity();
    const onSuccessFn = vi.fn();

    render(
      <TomisDenialModal
        opportunity={opp}
        {...defaultProps}
        onSuccessFn={onSuccessFn}
      />,
    );

    const input = screen.getByTestId("character-count-text-field");
    fireEvent.change(input, {
      target: { value: "Client has not made payments" },
    });

    const submitButton = screen.getByTestId("tomis-submit-button");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(postExternalRequest).toHaveBeenCalledTimes(1);
    });

    const [stateCode, requestType, body] = postExternalRequest.mock.calls[0];
    expect(stateCode).toBe("US_TN");
    expect(requestType).toBe("insert_contact_note");
    expect(body.contactTypeCodes).toEqual(["DECF", "DEIO"]);
    expect(body.contactNote).toBeDefined();
    expect(body.contactNoteId).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(body.stateCode).toBe("US_TN");
    expect(body.personExternalId).toBe("00431278");
    expect(body).not.toHaveProperty("contactTypeCode");
    expect(body).not.toHaveProperty("shouldQueueTask");
    expect(body).not.toHaveProperty("votersRightsCode");
    expect(doc).toHaveBeenCalledWith(
      { key: "clientUpdatesV2" },
      expect.stringMatching(
        /\/clientOpportunityUpdates\/usTnCompliantReporting2025Policy$/,
      ),
    );
    const [, , update] = updateClientUpdatesV2Document.mock.calls[0];
    const contactNoteId = body.contactNoteId;
    expect(update).toMatchObject({
      contactNote: {
        [contactNoteId]: {
          status: "PENDING",
          noteStatus: {},
          submitted: { date: expect.anything() },
          note: body.contactNote,
          contactTypeCodes: ["DECF", "DEIO"],
        },
      },
    });
  });

  it("filters out Other from TOMIS codes", async () => {
    const { postExternalRequest } = mockRootStore();
    postExternalRequest.mockResolvedValue({});
    const opp = tomisMockOpportunity();

    render(
      <TomisDenialModal
        opportunity={opp}
        {...defaultProps}
        reasons={["DECF", "Other"]}
      />,
    );

    const input = screen.getByTestId("character-count-text-field");
    fireEvent.change(input, { target: { value: "Test comment" } });
    fireEvent.click(screen.getByTestId("tomis-submit-button"));

    await waitFor(() => {
      expect(postExternalRequest).toHaveBeenCalledTimes(1);
    });

    const [, , body] = postExternalRequest.mock.calls[0];
    expect(body.contactTypeCodes).toEqual(["DECF"]);
  });

  it("does not submit when no TOMIS codes are selected", async () => {
    const { postExternalRequest, updateClientUpdatesV2Document } =
      mockRootStore();
    const opp = tomisMockOpportunity();

    render(
      <TomisDenialModal
        opportunity={opp}
        {...defaultProps}
        reasons={["Other"]}
      />,
    );

    const input = screen.getByTestId("character-count-text-field");
    fireEvent.change(input, { target: { value: "Test comment" } });

    const submitButton = screen.getByTestId("tomis-submit-button");
    expect(submitButton).toBeDisabled();
    fireEvent.click(submitButton);

    expect(updateClientUpdatesV2Document).not.toHaveBeenCalled();
    expect(postExternalRequest).not.toHaveBeenCalled();
  });

  it("shows loading state during submission", async () => {
    const { postExternalRequest } = mockRootStore();
    postExternalRequest.mockReturnValue(new Promise(() => undefined)); // never resolves
    const opp = tomisMockOpportunity();

    render(<TomisDenialModal opportunity={opp} {...defaultProps} />);

    const input = screen.getByTestId("character-count-text-field");
    fireEvent.change(input, { target: { value: "Test comment" } });
    fireEvent.click(screen.getByTestId("tomis-submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("tomis-loading-screen")).toBeInTheDocument();
    });
  });

  it("shows failure screen on API error", async () => {
    const { postExternalRequest } = mockRootStore();
    postExternalRequest.mockRejectedValue(new Error("API error"));
    const opp = tomisMockOpportunity();

    render(<TomisDenialModal opportunity={opp} {...defaultProps} />);

    const input = screen.getByTestId("character-count-text-field");
    fireEvent.change(input, { target: { value: "Test comment" } });
    fireEvent.click(screen.getByTestId("tomis-submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("tomis-failure-screen")).toBeInTheDocument();
    });
  });

  it("calls onSuccessFn and shows toast on success", async () => {
    const { postExternalRequest } = mockRootStore();
    postExternalRequest.mockResolvedValue({});
    const opp = tomisMockOpportunity();
    const onSuccessFn = vi.fn();

    render(
      <TomisDenialModal
        opportunity={opp}
        {...defaultProps}
        onSuccessFn={onSuccessFn}
      />,
    );

    const input = screen.getByTestId("character-count-text-field");
    fireEvent.change(input, {
      target: { value: "Client has not made payments" },
    });
    fireEvent.click(screen.getByTestId("tomis-submit-button"));

    await waitFor(() => {
      expect(onSuccessFn).toHaveBeenCalled();
      expect(toast).toHaveBeenCalled();
    });
  });

  it("resets comment and phase when modal reopens", () => {
    mockRootStore();
    const opp = tomisMockOpportunity();

    const { rerender } = render(
      <TomisDenialModal
        opportunity={opp}
        {...defaultProps}
        showModal={false}
      />,
    );

    rerender(
      <TomisDenialModal opportunity={opp} {...defaultProps} showModal />,
    );

    expect(screen.getByTestId("tomis-confirmation-screen")).toBeInTheDocument();
    const submitButton = screen.getByTestId("tomis-submit-button");
    expect(submitButton).toBeDisabled();
  });
});
