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
import ReactModal from "react-modal";

import { mockOpportunity } from "../../__tests__/testUtils";
import { SubmitRevisionModal } from "../SubmitRevisionModal";

const mockNavigate = vi.fn();
const mockToast = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useNavigate: () => mockNavigate,
}));

vi.mock("react-hot-toast", () => ({ default: mockToast }));

vi.mock("../../WorkflowsOfficerName/WorkflowsOfficerName", () => ({
  default: ({ officerId }: { officerId: string }) => <span>{officerId}</span>,
}));

vi.mock("../../views", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../views")>()),
  workflowsUrl: () => "/test-url",
}));

const mockOfficer = {
  staffExternalId: "officer1",
  surname: "Smith",
  givenNames: "John",
};
const mockWorkflowsStore = {
  availableOfficersWithOrWithoutCaseloads: [mockOfficer],
};

function setup(overrides: Partial<typeof mockOpportunity> = {}) {
  const onCloseFn = vi.fn();
  const opportunity = {
    ...mockOpportunity,
    person: { ...mockOpportunity.person, displayName: "Test Client" },
    actionHistory: [
      { type: "APPROVAL", updateById: mockOfficer.staffExternalId },
    ],
    setSupervisorResponse: vi.fn(),
    ...overrides,
  };

  render(
    <SubmitRevisionModal
      showModal
      onCloseFn={onCloseFn}
      opportunity={opportunity as any}
      workflowsStore={mockWorkflowsStore as any}
    />,
  );

  return { onCloseFn, opportunity };
}

function openDropdown() {
  fireEvent.click(
    screen.getByRole("button", { name: /Select a previous reviewer/ }),
  );
}

function selectOfficer() {
  openDropdown();
  fireEvent.click(
    screen.getByRole("menuitem", { name: mockOfficer.staffExternalId }),
  );
}

function enterReason(text = "Needs revision") {
  fireEvent.change(screen.getByPlaceholderText("Placeholder text"), {
    target: { value: text },
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  ReactModal.setAppElement(document.createElement("div"));
  vi.clearAllMocks();
});

afterEach(() => {
  vi.runAllTimers();
  vi.useRealTimers();
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

  it("clears selectedOfficer and reason so SendButton becomes disabled again", () => {
    setup();
    selectOfficer();
    enterReason();
    expect(screen.getByRole("button", { name: "Send" })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});

describe("SendButton", () => {
  it("renders with Send label", () => {
    setup();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("is disabled when neither officer nor reason is provided", () => {
    setup();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("is disabled when officer is selected but no reason is entered", () => {
    setup();
    selectOfficer();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("is disabled when reason is entered but no officer is selected", () => {
    setup();
    enterReason();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("is enabled when both officer and reason are provided", () => {
    setup();
    selectOfficer();
    enterReason();
    expect(screen.getByRole("button", { name: "Send" })).not.toBeDisabled();
  });

  it("calls setSupervisorResponse with REVISION type, notes, and reviewerId", () => {
    const { opportunity } = setup();
    selectOfficer();
    enterReason("Needs revision");
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(opportunity.setSupervisorResponse).toHaveBeenCalledWith({
      type: "REVISION",
      notes: "Needs revision",
      reviewerId: mockOfficer.staffExternalId,
    });
  });

  it("calls onCloseFn after sending", () => {
    const { onCloseFn } = setup();
    selectOfficer();
    enterReason();
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onCloseFn).toHaveBeenCalledOnce();
  });

  it("navigates to the opportunity clients page after sending", () => {
    setup();
    selectOfficer();
    enterReason();
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(mockNavigate).toHaveBeenCalledWith("/test-url");
  });

  it("shows a toast notification after sending", () => {
    setup();
    selectOfficer();
    enterReason();
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(mockToast).toHaveBeenCalledOnce();
  });

  it("does not call setSupervisorResponse when officer or reason is missing", () => {
    const { opportunity } = setup();
    selectOfficer();
    // reason is empty — clicking Send is a no-op because button is disabled
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(opportunity.setSupervisorResponse).not.toHaveBeenCalled();
  });
});

describe("Officer dropdown", () => {
  it("shows 'Select a previous reviewer' placeholder initially", () => {
    setup();
    expect(screen.getByText("Select a previous reviewer")).toBeInTheDocument();
  });

  it("lists previous reviewers from actionHistory in the dropdown", () => {
    setup();
    openDropdown();
    expect(
      screen.getByRole("menuitem", { name: mockOfficer.staffExternalId }),
    ).toBeInTheDocument();
  });

  it("shows the selected officer name after selection", () => {
    setup();
    selectOfficer();
    // placeholder is gone, officer id is shown in the toggle
    expect(
      screen.queryByText("Select a previous reviewer"),
    ).not.toBeInTheDocument();
  });

  it("shows 'Change' label after an officer is selected", () => {
    setup();
    selectOfficer();
    expect(screen.getByText("Change")).toBeInTheDocument();
  });

  it("only includes officers whose ids appear in APPROVAL actionHistory entries", () => {
    const otherOfficer = {
      id: "officer2",
      surname: "Jones",
      givenNames: "Jane",
    };
    const workflowsStoreWithBoth = {
      availableOfficersWithOrWithoutCaseloads: [mockOfficer, otherOfficer],
    };
    const opportunity = {
      ...mockOpportunity,
      actionHistory: [
        { type: "APPROVAL", updateById: mockOfficer.staffExternalId },
      ],
      setSupervisorResponse: vi.fn(),
    };

    render(
      <SubmitRevisionModal
        showModal
        onCloseFn={vi.fn()}
        opportunity={opportunity as any}
        workflowsStore={workflowsStoreWithBoth as any}
      />,
    );

    openDropdown();
    expect(
      screen.getByRole("menuitem", { name: mockOfficer.staffExternalId }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: otherOfficer.id }),
    ).not.toBeInTheDocument();
  });
});

describe("CurrentReviewer display", () => {
  it("shows the current reviewer when currentReviewerId is set", () => {
    setup({ currentReviewerId: mockOfficer.staffExternalId });
    expect(screen.getByText(/Current Reviewer/)).toBeInTheDocument();
  });

  it("does not show Current Reviewer section when currentReviewerId is undefined", () => {
    setup({ currentReviewerId: undefined });
    expect(screen.queryByText(/Current Reviewer/)).not.toBeInTheDocument();
  });
});
