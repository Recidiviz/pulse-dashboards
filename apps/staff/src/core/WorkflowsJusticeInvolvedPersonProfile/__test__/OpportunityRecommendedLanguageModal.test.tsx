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
import ReactModal from "react-modal";

import { useRootStore } from "../../../components/StoreProvider";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import { Client } from "../../../WorkflowsStore";
import { mockOpportunity } from "../../__tests__/testUtils";
import OpportunityRecommendedLanguageModal from "../OpportunityRecommendedLanguageModal";

jest.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as jest.Mock;

const almostEligibleMockOpportunity = {
  ...mockOpportunity,
  almostEligible: true,
  almostEligibleStatusMessage: "test message",
  almostEligibleRecommendedNote: {
    title: "almostEligibleCriteria",
    text: "recommendedAlmostEligibleCriteriaNote",
  },
  person: {
    stateCode: "US_OZ",
    pseudonymizedId: "abc123",
    displayPreferredName: "Client Name",
    assignedStaffId: "assignedStaffId",
    assignedStaffFullName: "Staff Name",
    fullName: { givenNames: "Client" },
  } as Client,
};

beforeEach(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

describe("OpportunityRecommendedLanguageModal", () => {
  let clickedSpy: jest.SpiedFunction<
    typeof AnalyticsStore.prototype.trackAlmostEligibleCopyCTAViewed
  >;
  let viewedSpy: jest.SpiedFunction<
    typeof AnalyticsStore.prototype.trackAlmostEligibleCopyCTAViewed
  >;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 1, 1));

    viewedSpy = jest
      .spyOn(AnalyticsStore.prototype, "trackAlmostEligibleCopyCTAViewed")
      .mockImplementation();
    clickedSpy = jest
      .spyOn(AnalyticsStore.prototype, "trackAlmostEligibleCopyCTAClicked")
      .mockImplementation();
    useRootStoreMock.mockReturnValue({
      analyticsStore: {
        trackAlmostEligibleCopyCTAClicked: clickedSpy,
        trackAlmostEligibleCopyCTAViewed: viewedSpy,
      },
    });

    render(
      <OpportunityRecommendedLanguageModal
        opportunity={almostEligibleMockOpportunity}
      >
        {almostEligibleMockOpportunity.almostEligibleRecommendedNote.title}
      </OpportunityRecommendedLanguageModal>,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("tracks when the copy CTA is viewed", () => {
    // Arrange
    const modalTriggerBtn = screen.getByRole("button", {
      name: almostEligibleMockOpportunity.almostEligibleRecommendedNote.title,
    });

    // Act
    fireEvent.click(modalTriggerBtn);

    // Assert
    expect(
      screen.getByRole("button", {
        name: "Copy to clipboard",
      }),
    ).toBeInTheDocument();
    expect(viewedSpy).toHaveBeenCalledOnce();
    expect(viewedSpy).toHaveBeenCalledWith({
      stateCode: almostEligibleMockOpportunity.person.stateCode,
      opportunityType: almostEligibleMockOpportunity.type,
      almostEligibleCriteria:
        almostEligibleMockOpportunity.almostEligibleRecommendedNote.title,
      justiceInvolvedPersonId:
        almostEligibleMockOpportunity.person.pseudonymizedId,
      justiceInvolvedPersonName:
        almostEligibleMockOpportunity.person.displayPreferredName,
      staffId: almostEligibleMockOpportunity.person.assignedStaffId,
      staffName: almostEligibleMockOpportunity.person.assignedStaffFullName,
      date: new Date(2024, 1, 1),
    });
  });

  it("tracks when the copy CTA is clicked", () => {
    // Arrange
    const modalTriggerBtn = screen.getByRole("button", {
      name: almostEligibleMockOpportunity.almostEligibleRecommendedNote.title,
    });
    fireEvent.click(modalTriggerBtn);
    const copyBtn = screen.getByRole("button", {
      name: "Copy to clipboard",
    });

    // Act
    fireEvent.click(copyBtn);

    // Assert
    expect(clickedSpy).toHaveBeenCalledOnce();
    expect(clickedSpy).toHaveBeenCalledWith({
      stateCode: almostEligibleMockOpportunity.person.stateCode,
      opportunityType: almostEligibleMockOpportunity.type,
      almostEligibleCriteria:
        almostEligibleMockOpportunity.almostEligibleRecommendedNote.title,
      justiceInvolvedPersonId:
        almostEligibleMockOpportunity.person.pseudonymizedId,
      justiceInvolvedPersonName:
        almostEligibleMockOpportunity.person.displayPreferredName,
      staffId: almostEligibleMockOpportunity.person.assignedStaffId,
      staffName: almostEligibleMockOpportunity.person.assignedStaffFullName,
      date: new Date(2024, 1, 1),
    });
  });
});
