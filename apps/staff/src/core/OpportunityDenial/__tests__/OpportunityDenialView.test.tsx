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

import {
  useFeatureVariants,
  useRootStore,
} from "../../../components/StoreProvider";
import {
  DenialConfirmationModalProps,
  Opportunity,
} from "../../../WorkflowsStore";
import { OTHER_KEY } from "../../../WorkflowsStore/utils";
import { mockOpportunity } from "../../__tests__/testUtils";
import { OpportunityDenialView } from "../OpportunityDenialView";

jest.mock("../../../components/StoreProvider");
jest.mock("../../WorkflowsJusticeInvolvedPersonProfile/Heading", () => ({
  Heading: () => <div>Mock Person Heading</div>,
}));

const useRootStoreMock = useRootStore as jest.Mock;
const useFeatureVariantsMock = useFeatureVariants as jest.Mock;

function renderElement(opportunity: Opportunity) {
  render(
    <BrowserRouter>
      <OpportunityDenialView opportunity={opportunity} />
    </BrowserRouter>,
  );
}

function getCheckbox(reason: string) {
  return screen.getByTestId(`OpportunityDenialView__checkbox-${reason}`);
}

describe("OpportunityDenialView", () => {
  beforeEach(() => {
    timekeeper.freeze("2023-10-5");
    useFeatureVariantsMock.mockReturnValue({
      enableSnooze: true,
    });
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        currentUserEmail: "mock-email",
      },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Other reason input", () => {
    beforeEach(() => {
      renderElement({
        ...mockOpportunity,
        autoSnooze: {
          snoozeUntil: "2024-10-10",
          snoozedOn: "",
          snoozedBy: "",
        },
        denialReasonsMap: {
          [OTHER_KEY]: "Other, please specify a reason",
        },
      });
    });

    it("disables the save button if no characters are entered", () => {
      const checkbox = getCheckbox("Other");
      if (checkbox) fireEvent.click(checkbox);
      expect(
        screen.getByTestId("OpportunityDenialView__button"),
      ).toBeDisabled();
    });

    it("disables the save button if less than 3 characters are entered", () => {
      const checkbox = getCheckbox("Other");
      if (checkbox) fireEvent.click(checkbox);
      const otherInput = screen.getByTestId("OtherReasonInput");
      if (otherInput) fireEvent.change(otherInput, { target: { value: "12" } });

      expect(
        screen.getByTestId("OpportunityDenialView__button"),
      ).toBeDisabled();
    });

    it("enables the save button when 3+ characters are entered", () => {
      const checkbox = getCheckbox("Other");
      if (checkbox) fireEvent.click(checkbox);
      const otherInput = screen.getByTestId("OtherReasonInput");
      if (otherInput)
        fireEvent.change(otherInput, { target: { value: "123" } });

      expect(screen.getByTestId("OpportunityDenialView__button")).toBeEnabled();
    });
  });

  describe("Change save button state on selected reason change", () => {
    const renderWithDenialReasons = (reasons: string[]) => {
      const opportunity = {
        ...mockOpportunity,
        denialReasonsMap: {
          reason1: "The first reason",
          reason2: "The second reason",
          reason3: "The third reason",
          [OTHER_KEY]: "Other, please specify a reason",
        },
      };

      if (reasons.length > 0) {
        opportunity.denial = {
          reasons,
        };
      }

      renderElement(opportunity);
    };

    it("disables the save button until a reason is selected", () => {
      renderWithDenialReasons([]);

      expect(
        screen.getByTestId("OpportunityDenialView__button"),
      ).toBeDisabled();

      const checkbox = getCheckbox("reason1");
      fireEvent.click(checkbox);

      expect(screen.getByTestId("OpportunityDenialView__button")).toBeEnabled();
    });

    it("disables the save button until preselected reasons are changed", () => {
      renderWithDenialReasons(["reason1"]);

      expect(
        screen.getByTestId("OpportunityDenialView__button"),
      ).toBeDisabled();

      const checkbox = getCheckbox("reason2");
      fireEvent.click(checkbox);

      expect(screen.getByTestId("OpportunityDenialView__button")).toBeEnabled();
    });

    it("redisables the save button if the checkboxes are restored to their initial state", () => {
      renderWithDenialReasons(["reason1", "reason2"]);

      const checkbox1 = getCheckbox("reason1");
      const checkbox3 = getCheckbox("reason3");

      expect(
        screen.getByTestId("OpportunityDenialView__button"),
      ).toBeDisabled();

      fireEvent.click(checkbox1);

      expect(screen.getByTestId("OpportunityDenialView__button")).toBeEnabled();

      fireEvent.click(checkbox1);

      expect(
        screen.getByTestId("OpportunityDenialView__button"),
      ).toBeDisabled();

      fireEvent.click(checkbox3);

      expect(screen.getByTestId("OpportunityDenialView__button")).toBeEnabled();

      fireEvent.click(checkbox3);

      expect(
        screen.getByTestId("OpportunityDenialView__button"),
      ).toBeDisabled();
    });

    it("enables save button when preselected reasons are removed", () => {
      renderWithDenialReasons(["reason3"]);

      expect(
        screen.getByTestId("OpportunityDenialView__button"),
      ).toBeDisabled();

      const checkbox = getCheckbox("reason3");
      fireEvent.click(checkbox);

      expect(screen.getByTestId("OpportunityDenialView__button")).toBeEnabled();
    });
  });

  describe("autoSnooze is enabled", () => {
    beforeEach(() => {
      renderElement({
        ...mockOpportunity,
        snoozedOnDate: new Date(2023, 9, 5),
        autoSnooze: {
          snoozeUntil: "2024-10-10",
          snoozedOn: "2023-10-05",
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
        screen.getByTestId("OpportunityDenialView__button"),
      ).toBeDisabled();
    });

    it("enables the save button when a reason is selected", () => {
      const checkbox = getCheckbox("CODE");
      if (checkbox) fireEvent.click(checkbox);
      expect(screen.getByTestId("OpportunityDenialView__button")).toBeEnabled();
    });

    it("displays the marked ineligible text", () => {
      expect(
        screen.getByText(
          "Client Name may be surfaced again on or after October 10, 2024.",
        ),
      ).toBeInTheDocument();
    });

    it("displays the denial reasons codes in a list", () => {
      const checkbox = getCheckbox("CODE");
      if (checkbox) fireEvent.click(checkbox);
      expect(
        screen.getByText("Not eligible reasons: CODE"),
      ).toBeInTheDocument();
    });
  });

  describe("manualSnooze is enabled", () => {
    beforeEach(() => {
      renderElement({
        ...mockOpportunity,
        config: {
          ...mockOpportunity.config,
          snooze: {
            defaultSnoozeDays: 30,
            maxSnoozeDays: 90,
          },
        },
        snoozedOnDate: new Date(2023, 9, 5),
        type: "compliantReporting",
        denialReasonsMap: {
          CODE: "Denial reason",
        },
      });
    });

    it("shows the slider", () => {
      expect(screen.getByText("Snooze for:")).toBeInTheDocument();
      expect(
        screen.getByTestId("OpportunityDenialView__slider"),
      ).toBeInTheDocument();
    });

    it("disables the save button if a reason is not selected", () => {
      expect(
        screen.getByTestId("OpportunityDenialView__button"),
      ).toBeDisabled();
    });

    it("disables the save button if the slider is touched but a reason is not selected", () => {
      const slider = screen
        .getByTestId("OpportunityDenialView__slider")
        .getElementsByTagName("input")[0];
      expect(slider).toBeInTheDocument();
      if (slider) fireEvent.change(slider, { target: { value: 60 } });
      expect(
        screen.getByTestId("OpportunityDenialView__button"),
      ).toBeDisabled();
    });

    it("enables the save button when a reason is selected", () => {
      const checkbox = getCheckbox("CODE");
      if (checkbox) fireEvent.click(checkbox);
      expect(screen.getByTestId("OpportunityDenialView__button")).toBeEnabled();
    });

    it("displays resurface text and denial reason codes", () => {
      expect(
        screen.getByText(
          "Client Name may be surfaced again on or after November 4, 2023.",
        ),
      ).toBeInTheDocument();
    });

    it("displays the denial reasons codes in a list", () => {
      const checkbox = getCheckbox("CODE");
      if (checkbox) fireEvent.click(checkbox);
      expect(
        screen.getByText("Not eligible reasons: CODE"),
      ).toBeInTheDocument();
    });
  });

  describe("save button logic when editing", () => {
    beforeEach(() => {
      renderElement({
        ...mockOpportunity,
        type: "compliantReporting",
        config: {
          ...mockOpportunity.config,
          snooze: {
            defaultSnoozeDays: 30,
            maxSnoozeDays: 90,
          },
        },
        snoozedOnDate: new Date(2023, 9, 5),
        manualSnooze: {
          snoozeForDays: 30,
          snoozedOn: "2023-10-05",
          snoozedBy: "",
        },
        denial: {
          reasons: ["CODE"],
        },
        denialReasonsMap: {
          CODE: "Denial reason",
          CODE2: "Denial reason2",
        },
      });
    });

    it("disables the save button if the form is untouched", () => {
      expect(
        screen.getByTestId("OpportunityDenialView__button"),
      ).toBeDisabled();
    });

    it("enables the save button when the slider is moved", () => {
      const slider = screen
        .getByTestId("OpportunityDenialView__slider")
        .getElementsByTagName("input")[0];
      if (slider) fireEvent.change(slider, { target: { value: 60 } });
      expect(screen.getByTestId("OpportunityDenialView__button")).toBeEnabled();

      if (slider) fireEvent.change(slider, { target: { value: 30 } });
      expect(
        screen.getByTestId("OpportunityDenialView__button"),
      ).toBeDisabled();
    });

    it("enables the save button when another reason is checked", () => {
      const checkbox = getCheckbox("CODE2");
      if (checkbox) fireEvent.click(checkbox);
      expect(screen.getByTestId("OpportunityDenialView__button")).toBeEnabled();
    });

    it("enables the save button when all reasons are unchecked", () => {
      const checkbox = getCheckbox("CODE");
      if (checkbox) fireEvent.click(checkbox);
      expect(screen.getByTestId("OpportunityDenialView__button")).toBeEnabled();
    });
  });

  describe("sentence length cap", () => {
    it("caps the slider's value at the person's release date", () => {
      timekeeper.freeze("2025-01-15");
      renderElement({
        ...mockOpportunity,
        type: "compliantReporting",
        config: {
          ...mockOpportunity.config,
          snooze: {
            defaultSnoozeDays: 30,
            maxSnoozeDays: 90,
          },
        },
      });

      const slider = screen
        .getByTestId("OpportunityDenialView__slider")
        .getElementsByTagName("input")[0];
      expect(slider).toHaveValue("17");
    });

    it("shows the special explanatory text", () => {
      timekeeper.freeze("2025-01-15");
      renderElement({
        ...mockOpportunity,
        config: {
          ...mockOpportunity.config,
          snooze: {
            defaultSnoozeDays: 30,
            maxSnoozeDays: 90,
          },
        },
        type: "compliantReporting",
      });

      expect(
        screen.getByText(
          "February 1, 2025 is Client Name's supervision end date.",
        ),
      ).toBeInTheDocument();
    });

    it("doesn't cap if the release date isn't in the future", () => {
      timekeeper.freeze("2025-02-01"); // our client's supervision end date
      renderElement({
        ...mockOpportunity,
        type: "compliantReporting",
        config: {
          ...mockOpportunity.config,
          snooze: {
            defaultSnoozeDays: 30,
            maxSnoozeDays: 90,
          },
        },
      });

      const slider = screen
        .getByTestId("OpportunityDenialView__slider")
        .getElementsByTagName("input")[0];
      expect(slider).toHaveValue("30");

      expect(
        screen.getByText(
          "Client Name may be surfaced again on or after March 3, 2025.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Override opportunity", () => {
    beforeEach(() => {
      renderElement({
        ...mockOpportunity,
        isAlert: true,
        snoozedOnDate: new Date(2023, 9, 5),
        deniedTabTitle: "Overridden",
        type: "compliantReporting",
        config: {
          ...mockOpportunity.config,
          snooze: {
            defaultSnoozeDays: 30,
            maxSnoozeDays: 90,
          },
        },
        denialReasonsMap: {
          CODE: "Denial reason",
        },
      });
    });
    it("shows the resurface text", () => {
      expect(
        screen.getByText(
          "Client Name may be surfaced again on or after November 4, 2023.",
        ),
      ).toBeInTheDocument();
    });

    it("shows the override language in the denial reasons text", () => {
      const checkbox = getCheckbox("CODE");
      if (checkbox) fireEvent.click(checkbox);
      expect(screen.getByText("Override reasons: CODE")).toBeInTheDocument();
    });
  });

  describe("enableSnooze featureVariant is not set", () => {
    beforeEach(() => {
      jest.resetAllMocks();
      useFeatureVariantsMock.mockReturnValue({});
    });

    it("does not show the slider even if config is set", () => {
      timekeeper.freeze("2023-10-5");
      renderElement({
        ...mockOpportunity,
        config: {
          ...mockOpportunity.config,
          snooze: {
            defaultSnoozeDays: 30,
            maxSnoozeDays: 90,
          },
        },
        type: "compliantReporting",
        denialReasonsMap: {
          CODE: "Denial reason",
        },
      });

      expect(screen.queryByText("Snooze for:")).toBeNull();
      expect(screen.queryByTestId("OpportunityDenialView__slider")).toBeNull();
    });

    it("does not display the auto-snooze date even if set in config", () => {
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

      expect(
        screen.queryByText("You will be reminded about this opportunity"),
      ).toBeNull();
    });

    // Note: This is a duplicate of the test group with the same name above to make sure
    // the feature variant does not affect the normal functionality
    describe("Other reason input", () => {
      beforeEach(() => {
        renderElement({
          ...mockOpportunity,
          autoSnooze: {
            snoozeUntil: "2024-10-10",
            snoozedOn: "",
            snoozedBy: "",
          },
          denialReasonsMap: {
            [OTHER_KEY]: "Other, please specify a reason",
          },
        });
      });

      it("disables the save button if no characters are entered", () => {
        const checkbox = getCheckbox("Other");
        if (checkbox) fireEvent.click(checkbox);
        expect(
          screen.getByTestId("OpportunityDenialView__button"),
        ).toBeDisabled();
      });

      it("disables the save button if less than 3 characters are entered", () => {
        const checkbox = getCheckbox("Other");
        if (checkbox) fireEvent.click(checkbox);
        const otherInput = screen.getByTestId("OtherReasonInput");
        if (otherInput)
          fireEvent.change(otherInput, { target: { value: "12" } });

        expect(
          screen.getByTestId("OpportunityDenialView__button"),
        ).toBeDisabled();
      });

      it("enables the save button when 3+ characters are entered", () => {
        const checkbox = getCheckbox("Other");
        if (checkbox) fireEvent.click(checkbox);
        const otherInput = screen.getByTestId("OtherReasonInput");
        if (otherInput)
          fireEvent.change(otherInput, { target: { value: "123" } });

        expect(
          screen.getByTestId("OpportunityDenialView__button"),
        ).toBeEnabled();
      });
    });
  });

  describe("Confirmation Modal", () => {
    it("submits directly if there's no modal", () => {
      const opp = {
        ...mockOpportunity,
        denialReasonsMap: {
          CODE: "Denial reason",
        },
        denial: {
          reasons: ["CODE"],
        },
      };

      jest.spyOn(opp, "deleteOpportunityDenialAndSnooze");

      renderElement(opp);

      // Get the form in a state where it's been modified and the reasons list is empty
      // because that's the easiest path in submitDenial() to mock.
      const checkbox = getCheckbox("CODE");
      if (checkbox) fireEvent.click(checkbox);

      fireEvent.click(screen.getByTestId("OpportunityDenialView__button"));

      expect(
        jest.mocked(opp.deleteOpportunityDenialAndSnooze).mock.calls,
      ).toHaveLength(1);
    });

    it("opens the modal and doesn't immediately submit", () => {
      const opp = {
        ...mockOpportunity,
        denialReasonsMap: {
          CODE: "Denial reason",
        },
        denial: {
          reasons: ["CODE"],
        },
        DenialConfirmationModal: ({
          showModal,
        }: DenialConfirmationModalProps) => (
          <div data-testid="stub-modal">
            {showModal ? "MODAL SHOWN" : "MODAL NOT SHOWN"}
          </div>
        ),
      };

      jest.spyOn(opp, "deleteOpportunityDenialAndSnooze");

      renderElement(opp);

      // Get the form in a state where it's been modified and the reasons list is empty
      // because that's the easiest path in submitDenial() to mock.
      const checkbox = getCheckbox("CODE");
      if (checkbox) fireEvent.click(checkbox);

      expect(screen.getByTestId("stub-modal")).toHaveTextContent(
        "MODAL NOT SHOWN",
      );

      fireEvent.click(screen.getByTestId("OpportunityDenialView__button"));

      expect(screen.getByTestId("stub-modal")).toHaveTextContent("MODAL SHOWN");

      expect(
        jest.mocked(opp.deleteOpportunityDenialAndSnooze).mock.calls,
      ).toHaveLength(0);
    });
  });
});
