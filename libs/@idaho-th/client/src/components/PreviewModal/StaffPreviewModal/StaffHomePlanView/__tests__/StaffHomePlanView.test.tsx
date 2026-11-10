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

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HOME_PLAN_TYPE } from "~@idaho-th/client/constants/common";
import { APPLICATION_STAGE } from "~@idaho-th/shared";

import {
  buildIdahoTHStore,
  renderWithStore,
} from "../../../../../test/renderWithStore";
import { StaffHomePlanView } from "../StaffHomePlanView";

const mocks = vi.hoisted(() => ({
  setManualAddress: vi.fn(),
  acceptProviderAsHomePlan: vi.fn(),
  setHomePlanApprovals: vi.fn(),
  advanceStage: vi.fn(),
  staffHomePlan: vi.fn(),
  staffApplicationById: vi.fn(),
  staffApplicationProviders: vi.fn(),
  currentApplicationDetail: vi.fn(),
  isSavingAddress: false,
  isAccepting: false,
  isSavingApprovals: false,
}));

const toastMock = vi.hoisted(() => {
  const fn = vi.fn() as ReturnType<typeof vi.fn> & {
    error: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
  };
  fn.error = vi.fn();
  fn.success = vi.fn();
  return fn;
});

vi.mock("react-hot-toast", () => ({ default: toastMock }));

vi.mock("~@idaho-th/client/hooks/housingApplication", () => ({
  useStaffHomePlan: () => mocks.staffHomePlan(),
  useSetManualAddressHomePlan: () => ({
    mutate: mocks.setManualAddress,
    isPending: mocks.isSavingAddress,
  }),
  useAcceptProviderAsHomePlan: () => ({
    mutate: mocks.acceptProviderAsHomePlan,
    isPending: mocks.isAccepting,
  }),
  useSetHomePlanApprovals: () => ({
    mutate: mocks.setHomePlanApprovals,
    isPending: mocks.isSavingApprovals,
  }),
  useAdvanceApplicationStage: () => ({
    mutate: mocks.advanceStage,
    isPending: false,
  }),
  useUpdateHousingApplication: () => ({ mutate: vi.fn(), isPending: false }),
  useToggleStaffHomePlanReleaseTask: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdateHomePlanReleaseTaskDetail: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("~@idaho-th/client/hooks/places", () => ({
  AUTOCOMPLETE_MIN_CHARS: 3,
  useAutocompleteAddresses: () => ({
    data: undefined,
    isFetching: false,
    isError: false,
  }),
}));

vi.mock("~@idaho-th/client/hooks/useApplicationDetail", () => ({
  useStaffApplicationById: () => mocks.staffApplicationById(),
  useStaffApplicationProviders: () => mocks.staffApplicationProviders(),
  useCurrentApplicationDetail: () => mocks.currentApplicationDetail(),
}));

vi.mock("../../../../Modal/Modal", () => ({
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

const APPLICATION_ID = "app-1";

function homePlanResult({
  homePlan = null,
  approvals = null,
  canSetApprovals = false,
  isLoading = false,
  isError = false,
}: Record<string, unknown> = {}) {
  return {
    data: isError
      ? undefined
      : {
          homePlan,
          approvals,
          permissions: { canSetApprovals },
          releaseTasks: null,
        },
    isLoading,
    isError,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isSavingAddress = false;
  mocks.isAccepting = false;
  mocks.isSavingApprovals = false;
  mocks.staffHomePlan.mockReturnValue(homePlanResult());
  mocks.staffApplicationById.mockReturnValue({
    data: { stage: APPLICATION_STAGE.APPROVALS },
  });
  mocks.staffApplicationProviders.mockReturnValue({
    data: { providers: [] },
    isLoading: false,
    isError: false,
  });
  mocks.currentApplicationDetail.mockReturnValue({
    formData: undefined,
    preferredProviders: [],
  });
});

function renderView({ withApplication = true } = {}) {
  const store = buildIdahoTHStore(
    withApplication ? { currentApplicationId: APPLICATION_ID } : {},
  );
  return renderWithStore(<StaffHomePlanView />, { store });
}

const SAVE_ADDRESS = "Add Address & Mark as Complete";
const CONFIRM_PROVIDER = "Set as Home Plan?";

/** Fills in the address modal and ticks its irreversibility acknowledgement. */
async function fillAddressModal(
  user: ReturnType<typeof userEvent.setup>,
  address: string,
) {
  await user.click(
    screen.getByRole("button", { name: "Enter an address manually" }),
  );
  await user.type(screen.getByRole("textbox"), address);
  // The acknowledgement checkbox has no accessible name of its own, and the
  // release-task list contributes checkboxes too, so scope to its own row.
  const acknowledgement = screen.getByText(
    /I understand that adding this address/,
  );
  await user.click(
    within(acknowledgement.parentElement as HTMLElement).getByRole("checkbox"),
  );
}

describe("StaffHomePlanView", () => {
  it("renders the panel with entry actions when there is no home plan", () => {
    renderView();

    expect(screen.getByText("Home Plan")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enter an address manually" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close Application" }),
    ).toBeInTheDocument();
  });

  it("reports a failed home-plan load instead of an empty row", () => {
    mocks.staffHomePlan.mockReturnValue(homePlanResult({ isError: true }));

    renderView();

    expect(screen.getByText("Failed to load home plan")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Enter an address manually" }),
    ).not.toBeInTheDocument();
  });

  describe("manual street address", () => {
    it("saves the address the modal collected", async () => {
      const user = userEvent.setup();
      renderView();

      await fillAddressModal(user, "12 Example St, Boise, ID");
      await user.click(screen.getByRole("button", { name: SAVE_ADDRESS }));

      expect(mocks.setManualAddress).toHaveBeenCalledTimes(1);
      expect(mocks.setManualAddress.mock.calls[0]?.[0]).toEqual({
        applicationId: APPLICATION_ID,
        address: "12 Example St, Boise, ID",
      });
    });

    it("tells the user the case closed once the address is saved", async () => {
      const user = userEvent.setup();
      renderView();
      await fillAddressModal(user, "12 Example St");
      await user.click(screen.getByRole("button", { name: SAVE_ADDRESS }));

      const [, handlers] = mocks.setManualAddress.mock.calls[0] as [
        unknown,
        { onSuccess: () => void },
      ];
      handlers.onSuccess();

      expect(toastMock).toHaveBeenCalledWith("Case closed");
      await waitFor(() =>
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument(),
      );
    });

    it("reports a save failure and keeps the modal open", async () => {
      const user = userEvent.setup();
      renderView();
      await fillAddressModal(user, "12 Example St");
      await user.click(screen.getByRole("button", { name: SAVE_ADDRESS }));

      const [, handlers] = mocks.setManualAddress.mock.calls[0] as [
        unknown,
        { onError: () => void },
      ];
      handlers.onError();

      expect(toastMock.error).toHaveBeenCalledWith("Failed to save address.");
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("refuses to save without an open application", async () => {
      const user = userEvent.setup();
      renderView({ withApplication: false });

      await fillAddressModal(user, "12 Example St");
      await user.click(screen.getByRole("button", { name: SAVE_ADDRESS }));

      expect(mocks.setManualAddress).not.toHaveBeenCalled();
      expect(toastMock.error).toHaveBeenCalledWith(
        "No active application found.",
      );
    });

    it("hides the approvals and release tasks once an address is the plan", () => {
      // A street address closes the case, so there is nothing left to approve.
      mocks.staffHomePlan.mockReturnValue(
        homePlanResult({
          homePlan: {
            type: HOME_PLAN_TYPE.MANUAL_ADDRESS,
            address: "12 Example St",
            provider: null,
            updatedAt: new Date("2026-03-04T00:00:00Z"),
          },
        }),
      );

      renderView();

      expect(screen.getByText("12 Example St")).toBeInTheDocument();
      expect(screen.queryByText("Approvals")).not.toBeInTheDocument();
      expect(screen.queryByText("Release Decision")).not.toBeInTheDocument();
    });
  });

  describe("provider home plan", () => {
    const eligibleProvider = {
      providerId: "provider-1",
      providerName: "Example House",
      providerLocation: null,
    };

    beforeEach(() => {
      mocks.staffApplicationProviders.mockReturnValue({
        data: { providers: [eligibleProvider] },
        isLoading: false,
        isError: false,
      });
    });

    it("confirms before accepting a provider", async () => {
      const user = userEvent.setup();
      renderView();

      await user.click(
        screen.getByRole("button", { name: "Select a provider" }),
      );
      await user.click(
        screen.getByRole("button", { name: "Set as Home Plan" }),
      );

      // The confirmation replaces the picker; nothing is written yet.
      expect(mocks.acceptProviderAsHomePlan).not.toHaveBeenCalled();
      expect(screen.getByText(CONFIRM_PROVIDER)).toBeInTheDocument();
      expect(
        screen.queryByText("Select Home Plan Provider"),
      ).not.toBeInTheDocument();
    });

    it("accepts the confirmed provider", async () => {
      const user = userEvent.setup();
      renderView();
      await user.click(
        screen.getByRole("button", { name: "Select a provider" }),
      );
      await user.click(
        screen.getByRole("button", { name: "Set as Home Plan" }),
      );

      await user.click(
        screen.getByRole("button", { name: "Set as Home Plan" }),
      );

      expect(mocks.acceptProviderAsHomePlan).toHaveBeenCalledTimes(1);
      expect(mocks.acceptProviderAsHomePlan.mock.calls[0]?.[0]).toEqual({
        applicationId: APPLICATION_ID,
        providerId: "provider-1",
      });
    });

    it("returns to the picker when the confirmation is dismissed", async () => {
      const user = userEvent.setup();
      renderView();
      await user.click(
        screen.getByRole("button", { name: "Select a provider" }),
      );
      await user.click(
        screen.getByRole("button", { name: "Set as Home Plan" }),
      );

      await user.click(screen.getByRole("button", { name: "Go back" }));

      expect(screen.getByText("Select Home Plan Provider")).toBeInTheDocument();
      expect(mocks.acceptProviderAsHomePlan).not.toHaveBeenCalled();
    });
  });

  describe("stage gating", () => {
    it("explains that the case has not reached the home-plan stage yet", () => {
      mocks.staffApplicationById.mockReturnValue({
        data: { stage: APPLICATION_STAGE.APPLICATION },
      });

      renderView();

      expect(screen.queryByText("Release Decision")).not.toBeInTheDocument();
    });

    it("hides Close Application once the case is closed", () => {
      mocks.staffApplicationById.mockReturnValue({
        data: { stage: APPLICATION_STAGE.CLOSED },
      });

      renderView();

      expect(
        screen.queryByRole("button", { name: "Close Application" }),
      ).not.toBeInTheDocument();
    });

    it("disables the home-plan entry actions once the case is closed", () => {
      mocks.staffApplicationById.mockReturnValue({
        data: { stage: APPLICATION_STAGE.CLOSED },
      });

      renderView();

      expect(
        screen.getByRole("button", { name: "Enter an address manually" }),
      ).toBeDisabled();
    });
  });

  describe("approvals", () => {
    // Rider cases record the court's Release Decision here, below the
    // investigation, so its Save is the second one.
    const INVESTIGATION_SAVE = 0;
    const RELEASE_SAVE = 1;

    function clickSave(index: number) {
      return userEvent
        .setup()
        .click(
          screen.getAllByRole("button", { name: "Save" })[index] as HTMLElement,
        );
    }

    beforeEach(() => {
      mocks.currentApplicationDetail.mockReturnValue({
        formData: { legalCurrentStatus: "Rider" },
        preferredProviders: [],
      });
      mocks.staffHomePlan.mockReturnValue(
        homePlanResult({
          canSetApprovals: true,
          approvals: {
            releaseDecision: null,
            homePlanInvestigation: null,
            badge: null,
          },
        }),
      );
    });

    it("saves a decision that leaves the case waiting, with no confirmation", async () => {
      const user = userEvent.setup();
      renderView();

      await user.click(
        screen.getByRole("radio", { name: "Probation granted" }),
      );
      await clickSave(RELEASE_SAVE);

      expect(mocks.setHomePlanApprovals).toHaveBeenCalledTimes(1);
      expect(mocks.setHomePlanApprovals.mock.calls[0]?.[0]).toEqual({
        applicationId: APPLICATION_ID,
        releaseDecision: "PROBATION_GRANTED",
      });
    });

    it("confirms before a decision that closes the case", async () => {
      const user = userEvent.setup();
      renderView();

      await user.click(screen.getByRole("radio", { name: "Probation denied" }));
      await clickSave(RELEASE_SAVE);

      expect(mocks.setHomePlanApprovals).not.toHaveBeenCalled();
    });

    it("confirms before a decision that advances the case", async () => {
      mocks.staffHomePlan.mockReturnValue(
        homePlanResult({
          canSetApprovals: true,
          approvals: {
            releaseDecision: "PROBATION_GRANTED",
            homePlanInvestigation: null,
            badge: null,
          },
        }),
      );
      const user = userEvent.setup();
      renderView();

      await user.click(
        screen.getByRole("radio", { name: "Home plan approved" }),
      );
      await clickSave(INVESTIGATION_SAVE);

      expect(mocks.setHomePlanApprovals).not.toHaveBeenCalled();
    });

    it("advances a Termer on the investigation once the stored parole decision cleared", async () => {
      mocks.currentApplicationDetail.mockReturnValue({
        formData: { legalCurrentStatus: "Termer" },
        preferredProviders: [],
      });
      mocks.staffApplicationById.mockReturnValue({
        data: {
          stage: APPLICATION_STAGE.APPROVALS,
          paroleCommissionDecision: "NOT_APPLICABLE",
        },
      });
      mocks.staffHomePlan.mockReturnValue(
        homePlanResult({
          canSetApprovals: true,
          homePlan: {
            type: HOME_PLAN_TYPE.PROVIDER,
            address: null,
            provider: null,
            updatedAt: new Date("2026-03-04T00:00:00Z"),
          },
          approvals: {
            releaseDecision: null,
            homePlanInvestigation: null,
            badge: null,
          },
        }),
      );
      const user = userEvent.setup();
      renderView();

      expect(screen.queryByText("Release Decision")).not.toBeInTheDocument();
      await user.click(screen.getByRole("radio", { name: "Not applicable" }));
      await clickSave(INVESTIGATION_SAVE);

      // The advance confirmation, not a direct save.
      expect(mocks.setHomePlanApprovals).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: "Advance to Release" }),
      ).toBeInTheDocument();
    });

    it("shows the release tasks when the home plan is approved", () => {
      mocks.staffHomePlan.mockReturnValue(
        homePlanResult({
          approvals: {
            releaseDecision: "PROBATION_GRANTED",
            homePlanInvestigation: "APPROVED",
            badge: "HOUSING_PLAN_APPROVED",
          },
        }),
      );
      renderView();

      expect(screen.getByText("Release Tasks")).toBeInTheDocument();
    });

    it.each([
      {
        name: "the release is denied",
        releaseDecision: "PROBATION_DENIED",
        homePlanInvestigation: null,
        badge: "RELEASE_DENIED",
      },
      {
        name: "the home plan is rejected",
        releaseDecision: null,
        homePlanInvestigation: "REJECTED",
        badge: "HOUSING_PLAN_REJECTED",
      },
    ])(
      "hides the release tasks and their divider when $name",
      ({ releaseDecision, homePlanInvestigation, badge }) => {
        mocks.staffHomePlan.mockReturnValue(
          homePlanResult({
            approvals: { releaseDecision, homePlanInvestigation, badge },
          }),
        );
        renderView();

        expect(screen.queryByText("Release Tasks")).not.toBeInTheDocument();
        // Only the divider above the approvals panel is left.
        expect(screen.getAllByRole("separator")).toHaveLength(1);
      },
    );

    it("reports an approvals save failure", async () => {
      const user = userEvent.setup();
      renderView();
      await user.click(
        screen.getByRole("radio", { name: "Probation granted" }),
      );
      await clickSave(RELEASE_SAVE);

      const [, handlers] = mocks.setHomePlanApprovals.mock.calls[0] as [
        unknown,
        { onError: () => void; onSettled: () => void },
      ];
      handlers.onError();
      handlers.onSettled();

      expect(toastMock.error).toHaveBeenCalledWith("Failed to save approvals.");
    });

    it("names the saved decision group in the confirmation toast", async () => {
      const user = userEvent.setup();
      renderView();
      await user.click(
        screen.getByRole("radio", { name: "Probation granted" }),
      );
      await clickSave(RELEASE_SAVE);

      const [, handlers] = mocks.setHomePlanApprovals.mock.calls[0] as [
        unknown,
        { onSuccess: () => void },
      ];
      handlers.onSuccess();

      expect(toastMock).toHaveBeenCalledWith("Release decision saved.");
    });

    it("refuses to save approvals without an open application", async () => {
      const user = userEvent.setup();
      renderView({ withApplication: false });

      await user.click(
        screen.getByRole("radio", { name: "Probation granted" }),
      );
      await clickSave(RELEASE_SAVE);

      expect(mocks.setHomePlanApprovals).not.toHaveBeenCalled();
      expect(toastMock.error).toHaveBeenCalledWith(
        "No active application found.",
      );
    });
  });
});
