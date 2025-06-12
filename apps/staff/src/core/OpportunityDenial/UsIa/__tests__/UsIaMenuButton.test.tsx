// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { Mock } from "vitest";

import { useRootStore } from "../../../../components/StoreProvider";
import { RootStore } from "../../../../RootStore";
import { UsIaEarlyDischargeOpportunity } from "../../../../WorkflowsStore/Opportunity/UsIa";
import { OpportunitySidePanelProvider } from "../../../WorkflowsJusticeInvolvedPersonProfile/OpportunitySidePanelContext";
import UsIaMenuButton from "../UsIaMenuButton";

vi.mock("../../../../components/StoreProvider", () => ({
  useRootStore: vi.fn(),
}));
const useRootStoreMock = vi.mocked(useRootStore);

describe("UsIaMenuButton", () => {
  let opportunity: UsIaEarlyDischargeOpportunity;
  let markSubmittedAndToast: Mock;
  let deleteSubmitted: Mock;

  beforeEach(() => {
    markSubmittedAndToast = vi.fn();
    deleteSubmitted = vi.fn();
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        currentUserEmail: "mock-email",
        updateSelectedOpportunityOnFullProfile: vi.fn(),
      },
    } as unknown as RootStore);
  });

  const menuOptionsByStatus = [
    [
      "ELIGIBLE_NOW",
      "Update Eligibility",
      ["Submit for Supervisor Approval", "Mark as Ineligible"],
    ],
    ["ACTION_PLAN_REVIEW", "Review", ["Request Revisions", "Approve Snooze"]],
    [
      "ACTION_PLAN_REVIEW_REVISION",
      "Update Eligibility",
      ["Edit Action Plan", "Mark as Eligible"],
    ],
    [
      "DISCHARGE_FORM_REVIEW",
      "Review",
      ["Approve Discharge and Forms", "Mark as Ineligible"],
    ],
    [
      "READY_FOR_DISCHARGE",
      "Update Eligibility",
      ["Mark Submitted", "Mark as Ineligible"],
    ],
    ["DENIED", "Update Eligibility", ["Change Snooze/Denial Reason"]],
    [
      "SUBMITTED",
      "Update Eligibility",
      ["Revert from Submitted", "Mark as Ineligible"],
    ],
  ];

  test.each(menuOptionsByStatus)(
    "renders appropriate menu options for %s status",
    (clientStatus, buttonLabel, expectedOptions) => {
      opportunity = {
        clientStatus,
      } as unknown as UsIaEarlyDischargeOpportunity;

      render(
        <OpportunitySidePanelProvider>
          <UsIaMenuButton
            opportunity={opportunity}
            markSubmittedAndToast={markSubmittedAndToast}
            deleteSubmitted={deleteSubmitted}
          />
        </OpportunitySidePanelProvider>,
      );

      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      const menuDropdownOptions = screen.getAllByRole("menuitem");
      const labels = menuDropdownOptions.map((node) => node.textContent);

      expect(menuButton.textContent).toEqual(buttonLabel);
      expect(labels.length).toEqual(expectedOptions.length);
      expect(labels).toEqual(expectedOptions);
    },
  );
});
