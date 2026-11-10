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

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StaffHomePlan } from "~@idaho-th/client/interfaces/common";

import { renderWithStore } from "../../../../../test/renderWithStore";
import { ApprovalsPanel } from "../ApprovalsPanel";
import type { ApprovalsDecisionField } from "../ApprovalsPanel.utils";

type Approvals = NonNullable<StaffHomePlan["approvals"]>;

function homePlanData({
  canSetApprovals = true,
  approvals = null,
}: {
  canSetApprovals?: boolean;
  approvals?: Partial<Approvals> | null;
} = {}): StaffHomePlan {
  return {
    homePlan: null,
    permissions: { canSetApprovals },
    ...(approvals
      ? {
          approvals: {
            releaseDecision: null,
            homePlanInvestigation: null,
            badge: null,
            ...approvals,
          },
        }
      : { approvals: null }),
  } as unknown as StaffHomePlan;
}

let onSave: ReturnType<typeof vi.fn>;

beforeEach(() => {
  onSave = vi.fn();
});

function renderPanel({
  data = homePlanData(),
  savingDecision = null,
  isRider = true,
}: {
  data?: StaffHomePlan | undefined;
  savingDecision?: ApprovalsDecisionField | null;
  isRider?: boolean;
} = {}) {
  return renderWithStore(
    <ApprovalsPanel
      homePlanData={data}
      isRider={isRider}
      onSave={onSave}
      savingDecision={savingDecision}
    />,
  );
}

// The investigation is listed first: for a Rider it happens before court.
const INVESTIGATION_SAVE = 0;
const RELEASE_SAVE = 1;

function saveButtons() {
  return screen.getAllByRole("button", { name: /^Save|^Saving/ });
}

function radioLabels() {
  return screen
    .getAllByRole("radio")
    .map((radio) => radio.getAttribute("value"));
}

describe("ApprovalsPanel", () => {
  it("no longer shows the Approvals heading or subheading", () => {
    renderPanel();

    expect(screen.queryByText("Approvals")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Once the case enters the Approvals stage/),
    ).not.toBeInTheDocument();
  });

  describe("for a Termer/PV", () => {
    it("shows only the Home Plan Investigation, with three options", () => {
      renderPanel({ isRider: false });

      expect(screen.getByText("Home Plan Investigation")).toBeInTheDocument();
      expect(screen.queryByText("Release Decision")).not.toBeInTheDocument();
      expect(radioLabels()).toEqual(["APPROVED", "REJECTED", "NOT_APPLICABLE"]);
    });

    it("saves the investigation result", async () => {
      const user = userEvent.setup();
      renderPanel({ isRider: false });

      await user.click(screen.getByRole("radio", { name: "Not applicable" }));
      await user.click(saveButtons()[0] as HTMLElement);

      expect(onSave).toHaveBeenCalledWith({
        homePlanInvestigation: "NOT_APPLICABLE",
      });
    });
  });

  describe("for a Rider", () => {
    it("shows the investigation (two options) above the Release Decision", () => {
      renderPanel();

      const investigation = screen.getByText("Home Plan Investigation");
      const release = screen.getByText("Release Decision");
      expect(
        investigation.compareDocumentPosition(release) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(radioLabels()).toEqual([
        "APPROVED",
        "REJECTED",
        "PROBATION_GRANTED",
        "PROBATION_DENIED",
      ]);
    });

    it("starts with both Save buttons disabled", () => {
      renderPanel();

      for (const button of saveButtons()) {
        expect(button).toBeDisabled();
      }
    });

    it("enables only the touched group's Save button", async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.click(
        screen.getByRole("radio", { name: "Probation granted" }),
      );

      expect(saveButtons()[RELEASE_SAVE]).toBeEnabled();
      expect(saveButtons()[INVESTIGATION_SAVE]).toBeDisabled();
    });

    it("saves the release decision before any investigation", async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.click(screen.getByRole("radio", { name: "Probation denied" }));
      await user.click(saveButtons()[RELEASE_SAVE] as HTMLElement);

      expect(onSave).toHaveBeenCalledWith({
        releaseDecision: "PROBATION_DENIED",
      });
    });

    it("saves only the investigation result from that group's button", async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.click(
        screen.getByRole("radio", { name: "Home plan rejected" }),
      );
      await user.click(saveButtons()[INVESTIGATION_SAVE] as HTMLElement);

      expect(onSave).toHaveBeenCalledWith({
        homePlanInvestigation: "REJECTED",
      });
    });

    it("seeds each group from the persisted decisions", () => {
      renderPanel({
        data: homePlanData({
          approvals: {
            releaseDecision: "PROBATION_GRANTED",
            homePlanInvestigation: "APPROVED",
          },
        }),
      });

      expect(
        screen.getByRole("radio", { name: "Probation granted" }),
      ).toBeChecked();
      expect(
        screen.getByRole("radio", { name: "Home plan approved" }),
      ).toBeChecked();
      for (const button of saveButtons()) {
        expect(button).toBeDisabled();
      }
    });
  });

  describe("while a save is in flight", () => {
    it("labels only the saving group and freezes every chip", () => {
      renderPanel({ savingDecision: "releaseDecision" });

      const buttons = saveButtons();
      expect(buttons[RELEASE_SAVE]).toHaveTextContent("Saving...");
      expect(buttons[INVESTIGATION_SAVE]).toHaveTextContent("Save");
      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).toBeDisabled();
      }
    });
  });

  describe("when the caller may not set approvals", () => {
    it("disables the chips and hides the Save buttons", () => {
      renderPanel({ data: homePlanData({ canSetApprovals: false }) });

      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).toBeDisabled();
      }
      expect(
        screen.queryByRole("button", { name: /^Save/ }),
      ).not.toBeInTheDocument();
    });

    it("collapses to a summary row once the decisions are frozen", () => {
      renderPanel({
        data: homePlanData({
          canSetApprovals: false,
          approvals: {
            homePlanInvestigation: "APPROVED",
            badge: "HOUSING_PLAN_APPROVED",
          },
        }),
      });

      expect(screen.getByText("Home Plan Investigation")).toBeInTheDocument();
      expect(screen.queryByText("Approvals")).not.toBeInTheDocument();
      expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    });
  });

  it("has no accessibility violations", async () => {
    const { container } = renderPanel();

    expect(await axe(container)).toHaveNoViolations();
  });
});
