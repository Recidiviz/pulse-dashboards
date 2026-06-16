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

import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import ReactModal from "react-modal";

import { mockOpportunity } from "../../__tests__/testUtils";
import { SubmitApprovalModal } from "../SubmitApprovalModal";

const mockNavigate = vi.fn();
const mockToast = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useNavigate: () => mockNavigate,
}));

vi.mock("react-hot-toast", () => ({ default: mockToast }));

const mockOfficer = { id: "officer1", surname: "Smith", givenNames: "John" };

vi.mock("../../PersonLookup/StaffLookup", () => ({
  StaffLookup: ({
    onSelect,
  }: {
    onSelect: (officer: typeof mockOfficer | null) => void;
  }) => {
    const [value, setValue] = useState("");
    const showResult = value.length >= 2;

    return (
      <div>
        <input
          aria-label="Staff ID or Name lookup"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {value && (
          <button
            aria-label="Clear search"
            type="button"
            onClick={() => {
              setValue("");
              onSelect(null);
            }}
          >
            ×
          </button>
        )}
        {showResult && (
          <button
            type="button"
            onClick={() => {
              onSelect(mockOfficer);
              setValue(`${mockOfficer.surname}, ${mockOfficer.givenNames}`);
            }}
          >
            {`${mockOfficer.surname}, ${mockOfficer.givenNames}`}
          </button>
        )}
      </div>
    );
  },
}));

vi.mock("../../views", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../views")>()),
  workflowsUrl: () => "/test-url",
}));

function setup(overrides: Partial<typeof mockOpportunity> = {}) {
  const onCloseFn = vi.fn();
  const opportunity = {
    ...mockOpportunity,
    person: { ...mockOpportunity.person, displayName: "Test Client" },
    setOfficerAction: vi.fn(),
    setSupervisorResponse: vi.fn(),
    ...overrides,
  };

  render(
    <SubmitApprovalModal
      showModal
      onCloseFn={onCloseFn}
      opportunity={opportunity as any}
      workflowsStore={{} as any}
    />,
  );

  return { onCloseFn, opportunity };
}

const selectOfficerViaLookup = () => {
  fireEvent.change(
    screen.getByRole("textbox", { name: "Staff ID or Name lookup" }),
    { target: { value: "Sm" } },
  );
  fireEvent.click(
    screen.getByText(`${mockOfficer.surname}, ${mockOfficer.givenNames}`),
  );
};

beforeEach(() => {
  ReactModal.setAppElement(document.createElement("div"));
  vi.clearAllMocks();
});

describe("CancelButton", () => {
  it("renders with Cancel label", () => {
    setup();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("calls onCloseFn when clicked", () => {
    const { onCloseFn } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCloseFn).toHaveBeenCalledOnce();
  });

  it("clears the selected officer so ForwardButton becomes disabled again", () => {
    setup();
    // Select an officer first so Forward becomes enabled
    selectOfficerViaLookup();
    expect(screen.getByRole("button", { name: "Forward" })).not.toBeDisabled();

    // Canceling should clear the selection
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    // Re-render would show disabled again — assert onCloseFn was called (modal
    // would close, so further interaction is moot) and that no action was submitted.
    expect(screen.getByRole("button", { name: "Forward" })).toBeDisabled();
  });
});

describe("ForwardButton", () => {
  it("renders with Forward label", () => {
    setup();
    expect(screen.getByRole("button", { name: "Forward" })).toBeInTheDocument();
  });

  it("is disabled when no officer is selected", () => {
    setup();
    expect(screen.getByRole("button", { name: "Forward" })).toBeDisabled();
  });

  it("is enabled after an officer is selected via StaffLookup", () => {
    setup();
    selectOfficerViaLookup();
    expect(screen.getByRole("button", { name: "Forward" })).not.toBeDisabled();
  });

  it("calls setOfficerAction with the selected officer's id", () => {
    const { opportunity } = setup();
    selectOfficerViaLookup();
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(opportunity.setOfficerAction).toHaveBeenCalledWith({
      type: "APPROVAL",
      reviewerId: mockOfficer.id,
    });
  });

  it("calls setSupervisorResponse when opportunity isInGrantReview", () => {
    const { opportunity } = setup({ isInGrantReview: true });
    selectOfficerViaLookup();
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(opportunity.setSupervisorResponse).toHaveBeenCalledWith({
      type: "APPROVAL",
    });
  });

  it("does not call setSupervisorResponse when opportunity is not in grant review", () => {
    const { opportunity } = setup({ isInGrantReview: false });
    selectOfficerViaLookup();
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(opportunity.setSupervisorResponse).not.toHaveBeenCalled();
  });

  it("calls onCloseFn after forwarding", () => {
    const { onCloseFn } = setup();
    selectOfficerViaLookup();
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(onCloseFn).toHaveBeenCalledOnce();
  });

  it("navigates to the opportunity clients page after forwarding", () => {
    setup();
    selectOfficerViaLookup();
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(mockNavigate).toHaveBeenCalledWith("/test-url");
  });

  it("shows a toast notification after forwarding", () => {
    setup();
    selectOfficerViaLookup();
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(mockToast).toHaveBeenCalledOnce();
  });
});
