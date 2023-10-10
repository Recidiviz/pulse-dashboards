// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { BrowserRouter } from "react-router-dom";
import timekeeper from "timekeeper";

import { useRootStore } from "../../../components/StoreProvider";
import { Opportunity } from "../../../WorkflowsStore";
import { mockOpportunity } from "../../__tests__/testUtils";
import { OpportunityDenialView } from "../OpportunityDenialView";

jest.mock("../../../components/StoreProvider");
jest.mock("../../WorkflowsClientProfile/Heading", () => ({
  Heading: () => <div>Mock Person Heading</div>,
}));

const useRootStoreMock = useRootStore as jest.Mock;

function renderElement(opportunity: Opportunity) {
  render(
    <BrowserRouter>
      <OpportunityDenialView opportunity={opportunity} />
    </BrowserRouter>
  );
}

describe("OpportunityDenialView", () => {
  beforeEach(() => {
    useRootStoreMock.mockReturnValue({
      workflowsStore: {},
    });
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("autoSnooze is enabled", () => {
    beforeEach(() => {
      renderElement({
        ...mockOpportunity,
        autoSnooze: {
          snoozeUntil: "2024-10-10",
          snoozedOn: "",
          snoozedBy: "",
        },
        denialReasonsMap: {
          CODE: "Denial reason",
        },
      });
    });

    it("does not show the slider", () => {
      expect(screen.queryByTestId("OpportunityDenialView__slider")).toBeNull();
    });

    it("disables the save button until a reason is selected", () => {
      expect(
        screen.getByTestId("OpportunityDenialView__button")
      ).toBeDisabled();
    });

    it("enables the save button when a reason is selected", () => {
      const checkbox = screen.getByTestId("OpportunityDenialView__checkbox");
      if (checkbox) fireEvent.click(checkbox);
      expect(screen.getByTestId("OpportunityDenialView__button")).toBeEnabled();
    });

    it("displays the auto snooze until date if available", () => {
      expect(
        screen.getByText(
          "You will be reminded about this opportunity on October 10, 2024"
        )
      );
    });
  });

  describe("manualSnooze is enabled", () => {
    beforeEach(() => {
      timekeeper.freeze("2023-10-5");
      renderElement({
        ...mockOpportunity,
        type: "compliantReporting",
        denialReasonsMap: {
          CODE: "Denial reason",
        },
      });
    });

    it("shows the slider", () => {
      expect(screen.getByText("Snooze for:")).toBeInTheDocument();
      expect(
        screen.getByTestId("OpportunityDenialView__slider")
      ).toBeInTheDocument();
    });

    it("disables the save button if a reason is not selected", () => {
      expect(
        screen.getByTestId("OpportunityDenialView__button")
      ).toBeDisabled();
    });

    it("enables the save button when a reason is selected", () => {
      const checkbox = screen.getByTestId("OpportunityDenialView__checkbox");
      if (checkbox) fireEvent.click(checkbox);
      expect(screen.getByTestId("OpportunityDenialView__button")).toBeEnabled();
    });

    it("displays the manual snooze until date if available", () => {
      expect(
        screen.getByText(
          "You will be reminded about this opportunity on November 4, 2023"
        )
      );
    });
  });
});
