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

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";

import { APPLICATION_STAGE, APPLICATION_SUB_STAGE } from "~@idaho-th/shared";

import { StaffApplicationDetailsView } from "../StaffApplicationDetailsView";

const testDoubles = vi.hoisted(() => ({
  applicationId: "app-1" as string | undefined,
  application: {
    createdAt: "2026-04-20T12:00:00.000Z",
    stage: "APPLICATION" as string,
  } as {
    createdAt: string;
    stage: string;
    subStage?: string;
    closedOutcome?: string;
    hasDuplicate?: boolean;
  },
  duplicate: vi.fn(),
  setActiveTab: vi.fn(),
  isPending: false,
}));

vi.mock("../../../../../datastores/IdahoTHStoreContext", () => ({
  useHousingApplicationsStore: () => ({
    currentApplicationId: testDoubles.applicationId,
  }),
  usePreviewModalStore: () => ({
    setActiveTab: testDoubles.setActiveTab,
  }),
}));

vi.mock("../../../../../hooks/useApplicationDetail", () => ({
  useStaffApplicationById: () => ({
    data: testDoubles.application,
  }),
}));

vi.mock("../../../../../hooks/housingApplication", () => ({
  useDuplicateHousingApplication: () => ({
    mutate: testDoubles.duplicate,
    isPending: testDoubles.isPending,
  }),
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("../../../../ConfirmationModal", () => ({
  ConfirmationModal: ({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    heading,
    subheading,
    primaryBtnText,
    secondaryBtnText,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
    heading: string;
    subheading: string;
    primaryBtnText: string;
    secondaryBtnText: string;
  }) =>
    isOpen ? (
      <div>
        <div>{heading}</div>
        <div>{subheading}</div>
        {isLoading && <div>Loading</div>}
        <button type="button" onClick={onConfirm}>
          {primaryBtnText}
        </button>
        <button type="button" onClick={onClose}>
          {secondaryBtnText}
        </button>
      </div>
    ) : null,
}));

vi.mock(
  "../../../ApplicationDetailsView/components/ApplicationSectionsPanel",
  () => ({
    ApplicationSectionsPanel: () => <div>Application sections</div>,
  }),
);

vi.mock("../../StaffClosedBanner", () => ({
  StaffClosedBanner: () => <div>Closed banner</div>,
}));

vi.mock("~@idaho-th/client/utils/date", () => ({
  formatTimestamp: (value: string) => `formatted:${value}`,
}));

describe("StaffApplicationDetailsView", () => {
  beforeEach(() => {
    testDoubles.applicationId = "app-1";
    testDoubles.application = {
      createdAt: "2026-04-20T12:00:00.000Z",
      stage: APPLICATION_STAGE.APPLICATION,
    };
    testDoubles.duplicate.mockReset();
    testDoubles.setActiveTab.mockReset();
    testDoubles.isPending = false;
  });

  it("shows the created date on Application Details", () => {
    render(
      <StaffApplicationDetailsView onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );
    expect(screen.getByText("Created Date")).toBeInTheDocument();
    expect(
      screen.getByText("formatted:2026-04-20T12:00:00.000Z"),
    ).toBeInTheDocument();
  });

  it("routes Add more providers to the Providers tab", async () => {
    const user = userEvent.setup();
    render(
      <StaffApplicationDetailsView onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );
    await user.click(
      screen.getByRole("button", { name: "Add more providers" }),
    );
    expect(testDoubles.setActiveTab).toHaveBeenCalledWith("providers");
  });

  it("opens confirmation popup and cancels with Go Back without duplicating", async () => {
    const user = userEvent.setup();
    render(
      <StaffApplicationDetailsView onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Duplicate Application" }),
    );
    expect(screen.getByText("Duplicate this application?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go Back" }));
    expect(
      screen.queryByText("Duplicate this application?"),
    ).not.toBeInTheDocument();
    expect(testDoubles.duplicate).not.toHaveBeenCalled();
  });

  it("duplicates the current application and navigates to the new one on confirm", async () => {
    const user = userEvent.setup();
    const onDuplicated = vi.fn();
    testDoubles.duplicate.mockImplementation((_input, options) => {
      options?.onSuccess?.({ applicationId: "app-2" });
    });

    render(
      <StaffApplicationDetailsView
        onClose={vi.fn()}
        onDuplicated={onDuplicated}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Duplicate Application" }),
    );
    await user.click(screen.getByRole("button", { name: "Yes, Duplicate" }));

    expect(testDoubles.duplicate).toHaveBeenCalledWith(
      { applicationId: "app-1" },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
    expect(onDuplicated).toHaveBeenCalledWith("app-2");
  });

  it("shows the confirm button loading state while duplicating", async () => {
    const user = userEvent.setup();
    testDoubles.isPending = true;
    render(
      <StaffApplicationDetailsView onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Duplicate Application" }),
    );
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("shows an error toast and does not navigate when duplication fails", async () => {
    const user = userEvent.setup();
    const onDuplicated = vi.fn();
    testDoubles.duplicate.mockImplementation((_input, options) => {
      options?.onError?.(new Error("boom"));
    });

    render(
      <StaffApplicationDetailsView
        onClose={vi.fn()}
        onDuplicated={onDuplicated}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Duplicate Application" }),
    );
    await user.click(screen.getByRole("button", { name: "Yes, Duplicate" }));

    expect(toast.error).toHaveBeenCalledWith(
      "Failed to duplicate application.",
    );
    expect(onDuplicated).not.toHaveBeenCalled();
  });

  it("disables Duplicate Application when the application is already closed", () => {
    testDoubles.application.stage = APPLICATION_STAGE.CLOSED;
    render(
      <StaffApplicationDetailsView onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: "Duplicate Application" }),
    ).toBeDisabled();
    expect(screen.getByText("Closed banner")).toBeInTheDocument();
  });

  it("enables Duplicate Application when the close was a revoked approval", () => {
    testDoubles.application.stage = APPLICATION_STAGE.CLOSED;
    testDoubles.application.subStage =
      APPLICATION_SUB_STAGE.CONDITIONAL_APPROVAL_REVOKED;
    render(
      <StaffApplicationDetailsView onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: "Duplicate Application" }),
    ).toBeEnabled();
  });

  it("enables Duplicate Application when the close was a rejected home plan", () => {
    testDoubles.application.stage = APPLICATION_STAGE.CLOSED;
    testDoubles.application.closedOutcome = "HOUSING_PLAN_REJECTED";
    render(
      <StaffApplicationDetailsView onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: "Duplicate Application" }),
    ).toBeEnabled();
  });

  it("disables Duplicate Application when the close was a denied release", () => {
    testDoubles.application.stage = APPLICATION_STAGE.CLOSED;
    testDoubles.application.closedOutcome = "RELEASE_DENIED";
    render(
      <StaffApplicationDetailsView onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: "Duplicate Application" }),
    ).toBeDisabled();
  });

  it("drops the closes-the-submission warning when duplicating a revoked application", async () => {
    const user = userEvent.setup();
    testDoubles.application.stage = APPLICATION_STAGE.CLOSED;
    testDoubles.application.subStage =
      APPLICATION_SUB_STAGE.CONDITIONAL_APPROVAL_REVOKED;
    render(
      <StaffApplicationDetailsView onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Duplicate Application" }),
    );

    expect(
      screen.getByText(
        "A new duplicate will be created. This can't be undone.",
      ),
    ).toBeInTheDocument();
  });

  it("disables Duplicate Application once a revoked application has a duplicate", () => {
    testDoubles.application.stage = APPLICATION_STAGE.CLOSED;
    testDoubles.application.subStage =
      APPLICATION_SUB_STAGE.CONDITIONAL_APPROVAL_REVOKED;
    testDoubles.application.hasDuplicate = true;
    render(
      <StaffApplicationDetailsView onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: "Duplicate Application" }),
    ).toBeDisabled();
  });
});
