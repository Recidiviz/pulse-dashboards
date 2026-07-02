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

import {
  useFeatureVariants,
  useRootStore,
} from "../../../../components/StoreProvider";
import { RootStore } from "../../../../RootStore";
import { UsNcCreditReductionReviewOpportunity } from "../../../../WorkflowsStore/Opportunity/UsNc/UsNcCreditReductionReviewOpportunity";
import { OpportunitySidePanelProvider } from "../../../WorkflowsJusticeInvolvedPersonProfile/OpportunitySidePanelContext";
import UsNcMenuButton from "../UsNcMenuButton";

vi.mock("../../../../components/StoreProvider", () => ({
  useRootStore: vi.fn(),
  useFeatureVariants: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({ default: vi.fn() }));

const useRootStoreMock = vi.mocked(useRootStore);
const useFeatureVariantsMock = vi.mocked(useFeatureVariants);

describe("UsNcMenuButton", () => {
  let opportunity: UsNcCreditReductionReviewOpportunity;
  let setAdjudicationStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        currentUserEmail: "mock-email",
        updateSelectedOpportunityOnFullProfile: vi.fn(),
      },
    } as unknown as RootStore);

    useFeatureVariantsMock.mockReturnValue({});

    setAdjudicationStatus = vi.fn().mockResolvedValue(undefined);

    opportunity = {
      isSubmitted: false,
      isGrantApproved: false,
      isInGrantReview: false,
      adjudicationStatus: undefined,
      submittedButtonText: "Mark as Submitted",
      undoSubmittedButtonText: "Undo Submission",
      setAdjudicationStatus,
      deleteAdjudicationStatus: vi.fn().mockResolvedValue(undefined),
      setSupervisorResponse: vi.fn().mockResolvedValue(undefined),
      setOfficerAction: vi.fn().mockResolvedValue(undefined),
      config: {
        supportsDenial: true,
        supportsSupervisorReviewOnGrants: false,
        grantReviewDropdownLabel: "Submit for Chief Review",
        reviewerFeatureVariant: "usNcCrrApprover",
        denialNoun: "eligibility",
        denialButtonText: undefined,
        denialAdjective: "Ineligible",
        label: "Credit Reduction Review",
      },
      denial: undefined,
      person: { displayName: "Test Person" },
      tabTitle: vi.fn().mockReturnValue("Eligible Now"),
    } as unknown as UsNcCreditReductionReviewOpportunity;
  });

  function renderButton() {
    render(
      <OpportunitySidePanelProvider>
        <UsNcMenuButton opportunity={opportunity} />
      </OpportunitySidePanelProvider>,
    );
  }

  test("renders Update status toggle", () => {
    renderButton();
    expect(screen.getByRole("button")).toHaveTextContent("Update status");
  });

  test("shows only submit and denial items when not submitted", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button"));

    const items = screen.getAllByRole("menuitem").map((el) => el.textContent);
    expect(items).toEqual(["Mark as Submitted", "Mark Ineligible"]);
  });

  test("shows adjudication options when submitted to Commission", () => {
    opportunity = {
      ...opportunity,
      isSubmitted: true,
    } as unknown as UsNcCreditReductionReviewOpportunity;
    renderButton();
    fireEvent.click(screen.getByRole("button"));

    const items = screen.getAllByRole("menuitem").map((el) => el.textContent);
    expect(items).toEqual([
      "Undo Submission",
      "Mark Approved",
      "Mark Partially Approved",
      "Mark Denied",
      "Mark Ineligible",
    ]);
  });

  test("clicking Mark Approved calls setAdjudicationStatus with Approved", async () => {
    opportunity = {
      ...opportunity,
      isSubmitted: true,
    } as unknown as UsNcCreditReductionReviewOpportunity;
    renderButton();
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Mark Approved"));
    expect(setAdjudicationStatus).toHaveBeenCalledWith("Approved");
  });

  test("clicking Mark Partially Approved calls setAdjudicationStatus with Partially Approved", async () => {
    opportunity = {
      ...opportunity,
      isSubmitted: true,
    } as unknown as UsNcCreditReductionReviewOpportunity;
    renderButton();
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Mark Partially Approved"));
    expect(setAdjudicationStatus).toHaveBeenCalledWith("Partially Approved");
  });

  test("clicking Mark Denied calls setAdjudicationStatus with Denied", async () => {
    opportunity = {
      ...opportunity,
      isSubmitted: true,
    } as unknown as UsNcCreditReductionReviewOpportunity;
    renderButton();
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Mark Denied"));
    expect(setAdjudicationStatus).toHaveBeenCalledWith("Denied");
  });

  test("shows Revert item and hides adjudication options when adjudicationStatus is set", () => {
    opportunity = {
      ...opportunity,
      adjudicationStatus: {
        adjudicationStatus: "Approved",
        by: "officer@nc.gov",
        date: null,
      },
    } as unknown as UsNcCreditReductionReviewOpportunity;
    renderButton();
    fireEvent.click(screen.getByRole("button"));

    const items = screen.getAllByRole("menuitem").map((el) => el.textContent);
    expect(items[0]).toBe("Revert from Approved");
    expect(items).not.toContain("Mark as Submitted");
    expect(items).not.toContain("Undo Submission");
    expect(items).not.toContain("Mark Approved");
    expect(items).not.toContain("Mark Partially Approved");
    expect(items).not.toContain("Mark Denied");
  });

  test("clicking Revert calls deleteAdjudicationStatus", async () => {
    const deleteAdjudicationStatus = vi.fn().mockResolvedValue(undefined);
    opportunity = {
      ...opportunity,
      adjudicationStatus: {
        adjudicationStatus: "Denied",
        by: "officer@nc.gov",
        date: null,
      },
      deleteAdjudicationStatus,
    } as unknown as UsNcCreditReductionReviewOpportunity;
    renderButton();
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Revert from Denied"));

    expect(deleteAdjudicationStatus).toHaveBeenCalled();
  });

  test("omits denial item when supportsDenial is false", () => {
    opportunity = {
      ...opportunity,
      config: { ...opportunity.config, supportsDenial: false },
    } as unknown as UsNcCreditReductionReviewOpportunity;
    renderButton();
    fireEvent.click(screen.getByRole("button"));

    const items = screen.getAllByRole("menuitem").map((el) => el.textContent);
    expect(items).toEqual(["Mark as Submitted"]);
  });

  describe("supervisor approval flow (FV enabled)", () => {
    beforeEach(() => {
      opportunity = {
        ...opportunity,
        config: {
          ...opportunity.config,
          supportsSupervisorReviewOnGrants: true,
        },
      } as unknown as UsNcCreditReductionReviewOpportunity;
    });

    test("shows Submit for Chief Review when eligible", () => {
      renderButton();
      fireEvent.click(screen.getByRole("button"));

      const items = screen.getAllByRole("menuitem").map((el) => el.textContent);
      expect(items).toEqual(["Submit for Chief Review", "Mark Ineligible"]);
    });

    test("shows Approve/Deny Request for reviewer when in grant review", () => {
      useFeatureVariantsMock.mockReturnValue({
        usNcCrrApprover: {},
      } as ReturnType<typeof useFeatureVariants>);
      opportunity = {
        ...opportunity,
        isInGrantReview: true,
      } as unknown as UsNcCreditReductionReviewOpportunity;
      renderButton();
      fireEvent.click(screen.getByRole("button"));

      const items = screen.getAllByRole("menuitem").map((el) => el.textContent);
      expect(items).toEqual(["Approve Request", "Deny Request"]);
    });

    test("shows only denial item for non-reviewer when in grant review", () => {
      opportunity = {
        ...opportunity,
        isInGrantReview: true,
      } as unknown as UsNcCreditReductionReviewOpportunity;
      renderButton();
      fireEvent.click(screen.getByRole("button"));

      const items = screen.getAllByRole("menuitem").map((el) => el.textContent);
      expect(items).toEqual(["Mark Ineligible"]);
    });

    test("shows Mark Submitted to Commission when chief has approved", () => {
      opportunity = {
        ...opportunity,
        isGrantApproved: true,
      } as unknown as UsNcCreditReductionReviewOpportunity;
      renderButton();
      fireEvent.click(screen.getByRole("button"));

      const items = screen.getAllByRole("menuitem").map((el) => el.textContent);
      expect(items).toEqual(["Mark as Submitted", "Mark Ineligible"]);
    });
  });
});
