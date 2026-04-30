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
import ReactModal from "react-modal";
import { setTimeout } from "timers/promises";
import { Mock } from "vitest";

import { useRootStore } from "../../../components/StoreProvider";
import { Client, Opportunity } from "../../../WorkflowsStore";
import { mockOpportunity } from "../../__tests__/testUtils";
import { ReioSubmissionModal } from "../ReioSubmissionModal";

vi.mock("../../../components/StoreProvider");

const mockRootStore = () => {
  const doc = vi.fn().mockReturnValue("mock-doc-ref");
  const postExternalRequest = vi.fn();
  const updateClientUpdatesV2Document = vi.fn().mockResolvedValue(undefined);

  (useRootStore as Mock).mockReturnValue({
    apiStore: { postExternalRequest },
    workflowsStore: { user: { info: { id: "STAFF123" } } },
    firestoreStore: {
      doc,
      updateClientUpdatesV2Document,
    },
  });

  return { doc, postExternalRequest, updateClientUpdatesV2Document };
};

const reioMockOpportunity = (): Opportunity => ({
  ...mockOpportunity,
  firestoreUpdateDocId: "usTnCompliantReporting2025Policy",
  person: {
    ...mockOpportunity.person,
    stateCode: "US_TN",
    externalId: "EXT456",
  } as Client,
});

beforeEach(() => {
  ReactModal.setAppElement(document.createElement("div"));
  vi.stubEnv("VITE_NEW_BACKEND_API_URL", "TEST_API_URL");
});

afterEach(async () => {
  await setTimeout(300);
});

describe("ReioSubmissionModal", () => {
  it("renders the editing form when open", () => {
    mockRootStore();

    render(
      <ReioSubmissionModal
        opportunity={reioMockOpportunity()}
        isOpen
        onClose={vi.fn()}
        onDownload={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Submit Compliant Reporting Referral Note/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("reio-download-only-button")).toBeInTheDocument();
    expect(screen.getByTestId("reio-submit-button")).toBeInTheDocument();
  });

  it("disables submit button when comment is too short", () => {
    mockRootStore();

    render(
      <ReioSubmissionModal
        opportunity={reioMockOpportunity()}
        isOpen
        onClose={vi.fn()}
        onDownload={vi.fn()}
      />,
    );

    const submitButton = screen.getByTestId("reio-submit-button");
    expect(submitButton).toBeDisabled();

    const textarea = screen.getByPlaceholderText("Please specify a reason...");
    fireEvent.change(textarea, { target: { value: "ab" } });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when comment meets minimum length", () => {
    mockRootStore();

    render(
      <ReioSubmissionModal
        opportunity={reioMockOpportunity()}
        isOpen
        onClose={vi.fn()}
        onDownload={vi.fn()}
      />,
    );

    const submitButton = screen.getByTestId("reio-submit-button");
    const textarea = screen.getByPlaceholderText("Please specify a reason...");

    fireEvent.change(textarea, { target: { value: "abc" } });
    expect(submitButton).not.toBeDisabled();
  });

  it("POSTs with contactTypeCodes ['REIO'] and pre-creates the stable status doc", async () => {
    const { doc, postExternalRequest, updateClientUpdatesV2Document } =
      mockRootStore();
    postExternalRequest.mockResolvedValue({});

    render(
      <ReioSubmissionModal
        opportunity={reioMockOpportunity()}
        isOpen
        onClose={vi.fn()}
        onDownload={vi.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText("Please specify a reason...");
    fireEvent.change(textarea, {
      target: { value: "Referral comment for REIO submission" },
    });

    fireEvent.click(screen.getByTestId("reio-submit-button"));

    await waitFor(() => {
      expect(postExternalRequest).toHaveBeenCalledOnce();
      const [stateCode, requestType, body] = postExternalRequest.mock.calls[0];
      expect(stateCode).toBe("US_TN");
      expect(requestType).toBe("insert_contact_note");
      expect(body).toMatchObject({
        stateCode: "US_TN",
        contactTypeCodes: ["REIO"],
        staffId: "STAFF123",
        staffIdType: "US_TN_STAFF_TOMIS",
        personExternalIdType: "US_TN_DOC",
      });
      expect(body.contactNoteId).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(body).not.toHaveProperty("contactTypeCode");
    });

    expect(doc).toHaveBeenCalledWith(
      { key: "clientUpdatesV2" },
      expect.stringMatching(
        /\/clientOpportunityUpdates\/usTnCompliantReporting2025Policy$/,
      ),
    );
    const [, , update] = updateClientUpdatesV2Document.mock.calls[0];
    const [, , body] = postExternalRequest.mock.calls[0];
    const contactNoteId = body.contactNoteId;
    expect(update).toMatchObject({
      contactNote: {
        [contactNoteId]: {
          status: "PENDING",
          noteStatus: {},
          submitted: { date: expect.anything() },
          note: body.contactNote,
          contactTypeCodes: ["REIO"],
        },
      },
    });
  });

  it("shows loading screen during submission", async () => {
    mockRootStore();

    render(
      <ReioSubmissionModal
        opportunity={reioMockOpportunity()}
        isOpen
        onClose={vi.fn()}
        onDownload={vi.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText("Please specify a reason...");
    fireEvent.change(textarea, { target: { value: "Test comment" } });

    fireEvent.click(screen.getByTestId("reio-submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("reio-loading-screen")).toBeInTheDocument();
    });
  });

  it("shows success screen after successful submission", async () => {
    const { postExternalRequest } = mockRootStore();
    postExternalRequest.mockResolvedValue({});

    render(
      <ReioSubmissionModal
        opportunity={reioMockOpportunity()}
        isOpen
        onClose={vi.fn()}
        onDownload={vi.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText("Please specify a reason...");
    fireEvent.change(textarea, { target: { value: "Test comment" } });

    fireEvent.click(screen.getByTestId("reio-submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("reio-success-screen")).toBeInTheDocument();
      expect(screen.getByText("Note Submitted")).toBeInTheDocument();
    });
  });

  it("shows failure screen when API request fails", async () => {
    const { postExternalRequest } = mockRootStore();
    postExternalRequest.mockRejectedValue(new Error("network error"));

    render(
      <ReioSubmissionModal
        opportunity={reioMockOpportunity()}
        isOpen
        onClose={vi.fn()}
        onDownload={vi.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText("Please specify a reason...");
    fireEvent.change(textarea, { target: { value: "Test comment" } });

    fireEvent.click(screen.getByTestId("reio-submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("reio-failure-screen")).toBeInTheDocument();
    });
  });

  it("calls onDownload and closes when download only button is clicked", async () => {
    mockRootStore();
    const onClose = vi.fn();
    const onDownload = vi.fn().mockResolvedValue(undefined);

    render(
      <ReioSubmissionModal
        opportunity={reioMockOpportunity()}
        isOpen
        onClose={onClose}
        onDownload={onDownload}
      />,
    );

    fireEvent.click(screen.getByTestId("reio-download-only-button"));

    await waitFor(() => {
      expect(onDownload).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it("triggers download on successful submit", async () => {
    const { postExternalRequest } = mockRootStore();
    postExternalRequest.mockResolvedValue({});
    const onDownload = vi.fn().mockResolvedValue(undefined);

    render(
      <ReioSubmissionModal
        opportunity={reioMockOpportunity()}
        isOpen
        onClose={vi.fn()}
        onDownload={onDownload}
      />,
    );

    const textarea = screen.getByPlaceholderText("Please specify a reason...");
    fireEvent.change(textarea, { target: { value: "Test comment" } });
    fireEvent.click(screen.getByTestId("reio-submit-button"));

    await waitFor(() => {
      expect(postExternalRequest).toHaveBeenCalledOnce();
      expect(onDownload).toHaveBeenCalledOnce();
      expect(screen.getByTestId("reio-success-screen")).toBeInTheDocument();
    });
  });

  it("resets state when modal is closed and reopened", async () => {
    const { postExternalRequest } = mockRootStore();
    postExternalRequest.mockResolvedValue({});

    const { unmount } = render(
      <ReioSubmissionModal
        opportunity={reioMockOpportunity()}
        isOpen
        onClose={vi.fn()}
        onDownload={vi.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText("Please specify a reason...");
    fireEvent.change(textarea, { target: { value: "Test comment" } });
    fireEvent.click(screen.getByTestId("reio-submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("reio-success-screen")).toBeInTheDocument();
    });

    unmount();

    render(
      <ReioSubmissionModal
        opportunity={reioMockOpportunity()}
        isOpen
        onClose={vi.fn()}
        onDownload={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Submit Compliant Reporting Referral Note/),
      ).toBeInTheDocument();
      expect(screen.getByTestId("reio-submit-button")).toBeDisabled();
    });
  });
});
