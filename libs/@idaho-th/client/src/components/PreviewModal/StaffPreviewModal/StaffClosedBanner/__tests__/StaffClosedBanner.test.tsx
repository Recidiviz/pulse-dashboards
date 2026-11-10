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
import { axe } from "jest-axe";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StaffClosedBanner } from "../StaffClosedBanner";

const mocks = vi.hoisted(() => ({
  application: undefined as Record<string, unknown> | undefined,
  acknowledge: vi.fn(),
}));

vi.mock("../../../../../datastores/IdahoTHStoreContext", () => ({
  useHousingApplicationsStore: () => ({ currentApplicationId: "app-1" }),
}));

vi.mock("../../../../../hooks/useApplicationDetail", () => ({
  useStaffApplicationById: () => ({ data: mocks.application }),
  useStaffApplicationProviders: () => ({
    data: {
      providers: [
        {
          providerId: "provider-a",
          providerName: "Acme Housing",
          approvalRevoked: {
            message: "The bed is no longer available",
            createdAt: new Date("2026-10-20T00:00:00Z"),
          },
        },
      ],
    },
  }),
}));

vi.mock("../../../../../hooks/housingApplication", () => ({
  useAcknowledgeApprovalRevoked: () => ({
    isPending: false,
    mutate: mocks.acknowledge,
  }),
}));

const REVOKED_COPY =
  "This application is closed because Acme Housing revoked their conditional approval: 'The bed is no longer available'. To send it out to more providers, please start a new application or duplicate this one.";

function revokedApplication(overrides: Record<string, unknown> = {}) {
  return {
    id: "app-1",
    stage: "CLOSED",
    subStage: "CONDITIONAL_APPROVAL_REVOKED",
    status: "ACTION_NEEDED",
    hasDuplicate: false,
    homePlan: { type: "PROVIDER", selectedProviderId: "provider-a" },
    ...overrides,
  };
}

function renderBanner() {
  return render(<StaffClosedBanner />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.application = revokedApplication();
});

describe("StaffClosedBanner", () => {
  it("shows the generic closed banner for any other close", () => {
    mocks.application = revokedApplication({ subStage: "CANCELED" });

    renderBanner();

    expect(
      screen.getByText(
        "This application has been closed. To create a new housing plan, please start a new application.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mark as done" }),
    ).not.toBeInTheDocument();
  });

  it("explains the revoke with the provider's reason", () => {
    renderBanner();

    const reason = screen.getByText("'The bed is no longer available'");
    expect(reason.tagName).toBe("EM");
    expect(reason.closest("p")).toHaveTextContent(REVOKED_COPY);
    expect(
      screen.queryByRole("button", { name: /duplicate/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark as done" }),
    ).toBeInTheDocument();
  });

  it("hides Mark as done once the status is Done", () => {
    mocks.application = revokedApplication({ status: "DONE" });

    renderBanner();

    expect(
      screen.getByText("'The bed is no longer available'").closest("p"),
    ).toHaveTextContent(REVOKED_COPY);
    expect(
      screen.queryByRole("button", { name: "Mark as done" }),
    ).not.toBeInTheDocument();
  });

  it("toasts after marking as done", async () => {
    const toastSuccess = vi.spyOn(toast, "success");
    mocks.acknowledge.mockImplementation((_input, { onSuccess }) =>
      onSuccess(),
    );
    renderBanner();

    await userEvent.click(screen.getByRole("button", { name: "Mark as done" }));

    expect(mocks.acknowledge).toHaveBeenCalledWith(
      { applicationId: "app-1" },
      expect.anything(),
    );
    expect(toastSuccess).toHaveBeenCalledWith("Application marked as done.");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderBanner();

    expect(await axe(container)).toHaveNoViolations();
  });
});
