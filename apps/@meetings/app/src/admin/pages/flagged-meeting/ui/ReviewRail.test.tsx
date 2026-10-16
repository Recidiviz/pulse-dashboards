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

import { fireEvent, render, screen } from "@testing-library/react-native";

import type {
  FlaggedMeetingDetails,
  ReviewOutcomeSummary,
} from "~@meetings/app/admin/api/flaggedMeetings";

import {
  makeDetails,
  makeRater,
  makeReviews,
  withRaters,
} from "../lib/detailsFixture";
import { ReviewRail } from "./ReviewRail";

const mockMutate = jest.fn();
const mockSetSent = jest.fn();
const mockShowSnackbar = jest.fn();
let mockMutationOptions: {
  onSuccess: (result: unknown, input: { section: string }) => Promise<void>;
};

jest.mock("~@meetings/app/shared/api", () => ({
  trpc: {
    useUtils: () => ({
      v1: {
        flaggedMeetings: {
          getDetails: { invalidate: jest.fn() },
          list: { invalidate: jest.fn() },
          listStaffEmails: { invalidate: jest.fn() },
        },
      },
    }),
    v1: {
      flaggedMeetings: {
        recordOutcome: {
          useMutation: (options: typeof mockMutationOptions) => {
            mockMutationOptions = options;
            return {
              mutate: mockMutate,
              reset: jest.fn(),
              isPending: false,
              error: null,
            };
          },
        },
        setStaffEmailSent: {
          useMutation: () => ({
            mutate: mockSetSent,
            isPending: false,
            error: null,
          }),
        },
      },
    },
  },
}));

jest.mock("~@meetings/app/shared/ui/Snackbar", () => ({
  useSnackbar: () => ({ showSnackbar: mockShowSnackbar }),
}));

const flag = { llm: false, labelStudio: false, vote: false };

const outcome: ReviewOutcomeSummary = {
  id: "outcome-1",
  outcome: "CONFIRMED_BAD",
  followUp: "EMAIL_STAFF",
  correctedGrade: null,
  overriddenSources: [],
  appliesTo: [],
  notetakingPromptFollowUp: false,
  judgePromptFollowUp: false,
  staffEmailSentAt: null,
  staffEmailSentBy: null,
  notes: "Invented a UA refusal.",
  reviewerEmail: "admin@example.com",
  createdAt: new Date("2026-09-10T12:00:00Z"),
};

const details = (overrides: Partial<FlaggedMeetingDetails> = {}) =>
  makeDetails({
    sections: {
      CASE_NOTE: { ...flag, llm: true, labelStudio: true },
      ACTION_ITEMS: flag,
      OVERALL: flag,
    },
    ...overrides,
  });

describe("ReviewRail", () => {
  beforeEach(() => jest.clearAllMocks());

  it("describes what flagged the section and starts as needs review", () => {
    render(<ReviewRail details={details()} />);

    expect(screen.getByText("Needs review")).toBeTruthy();
    expect(
      screen.getByText(
        "Case note flagged by the LLM judge, Label Studio (0 raters).",
      ),
    ).toBeTruthy();
  });

  it("records a confirmed BAD with its follow-up", () => {
    render(<ReviewRail details={details()} />);

    fireEvent.press(screen.getByRole("radio", { name: /Confirmed BAD/ }));
    fireEvent.press(screen.getByText("Email staff"));
    fireEvent.changeText(
      screen.getByPlaceholderText("Why this grade is right or wrong"),
      "  Invented a UA refusal. ",
    );
    fireEvent.press(screen.getByText("Record outcome"));

    expect(mockMutate).toHaveBeenCalledWith({
      stateCode: "US_NE",
      meetingId: "meeting-123",
      section: "CASE_NOTE",
      outcome: "CONFIRMED_BAD",
      followUp: "EMAIL_STAFF",
      notetakingPromptFollowUp: false,
      judgePromptFollowUp: false,
      notes: "Invented a UA refusal.",
    });
  });

  it("records which prompts may need an update", () => {
    render(<ReviewRail details={details()} />);

    fireEvent.press(screen.getByRole("radio", { name: /Confirmed BAD/ }));
    fireEvent.press(screen.getByText("LLM judge prompt may need an update"));
    fireEvent.press(screen.getByText("Record outcome"));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        notetakingPromptFollowUp: false,
        judgePromptFollowUp: true,
      }),
    );
  });

  it("does not record until an outcome is chosen", () => {
    render(<ReviewRail details={details()} />);

    fireEvent.press(screen.getByText("Record outcome"));

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("offers to override the ratings that flagged it, and says Label Studio is written", () => {
    render(<ReviewRail details={details()} />);

    fireEvent.press(screen.getByRole("radio", { name: /Not BAD/ }));

    expect(screen.getByRole("checkbox", { name: "LLM judge" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Label Studio" })).toBeTruthy();
    expect(
      screen.getByText(/also records a Good rating in Label Studio as admin@/),
    ).toBeTruthy();

    // Deselecting Label Studio sends only the judge override.
    fireEvent.press(screen.getByRole("checkbox", { name: "Label Studio" }));
    expect(screen.queryByText(/also records a Good rating/)).toBeNull();
    fireEvent.press(screen.getByText("Partial"));
    fireEvent.press(screen.getByText("Record outcome"));

    expect(mockMutate).toHaveBeenCalledWith({
      stateCode: "US_NE",
      meetingId: "meeting-123",
      notetakingPromptFollowUp: false,
      judgePromptFollowUp: false,
      section: "CASE_NOTE",
      outcome: "NOT_BAD",
      correctedGrade: "PARTIAL",
      overriddenSources: ["LLM_JUDGE"],
      followUp: "NO_ACTION",
    });
  });

  it("lets a Label Studio rating that did not flag the section be overridden, unselected by default", () => {
    render(
      <ReviewRail
        details={details({
          sections: {
            CASE_NOTE: { ...flag, llm: true },
            ACTION_ITEMS: flag,
            OVERALL: flag,
          },
          labelStudio: withRaters(
            [makeRater({ grades: { caseNote: "PARTIAL" } })],
            {
              overall: {
                grade: null,
                worst: null,
                overriddenByAuthoritative: false,
              },
              caseNote: {
                grade: "PARTIAL",
                worst: "PARTIAL",
                overriddenByAuthoritative: false,
              },
              actionItems: {
                grade: null,
                worst: null,
                overriddenByAuthoritative: false,
              },
            },
          ),
        })}
      />,
    );

    fireEvent.press(screen.getByRole("radio", { name: /Not BAD/ }));
    // Only the judge flagged it, so only the judge starts selected.
    expect(screen.queryByText(/also records a Good rating/)).toBeNull();

    fireEvent.press(screen.getByRole("checkbox", { name: "Label Studio" }));
    expect(screen.getByText(/also records a Good rating/)).toBeTruthy();
    fireEvent.press(screen.getByText("Record outcome"));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        overriddenSources: ["LLM_JUDGE", "LABEL_STUDIO"],
      }),
    );
  });

  it("asks which sections an Overall outcome covers, and allows neither", () => {
    render(
      <ReviewRail
        details={details({
          sections: {
            CASE_NOTE: flag,
            ACTION_ITEMS: flag,
            OVERALL: { ...flag, llm: true },
          },
          reviews: makeReviews({
            CASE_NOTE: {
              status: "not_flagged",
              latestOutcome: null,
              reopened: null,
            },
            OVERALL: {
              status: "needs_review",
              latestOutcome: null,
              reopened: null,
            },
          }),
        })}
      />,
    );

    fireEvent.press(screen.getByRole("radio", { name: /Confirmed BAD/ }));
    fireEvent.press(screen.getByText("Record outcome"));
    expect(mockMutate).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText("Neither"));
    fireEvent.press(screen.getByText("Record outcome"));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ section: "OVERALL", appliesTo: [] }),
    );
  });

  it("has no ratings to override when only in-app feedback flagged it", () => {
    render(
      <ReviewRail
        details={details({
          sections: {
            CASE_NOTE: { ...flag, vote: true },
            ACTION_ITEMS: flag,
            OVERALL: flag,
          },
        })}
      />,
    );

    fireEvent.press(screen.getByRole("radio", { name: /Not BAD/ }));
    expect(screen.getByText(/Only in-app feedback flagged this/)).toBeTruthy();
    expect(screen.queryByText("Corrected grade")).toBeNull();
    expect(screen.queryByText(/Ratings to override/)).toBeNull();

    fireEvent.press(screen.getByText("Record outcome"));
    const input = mockMutate.mock.calls[0][0];
    expect(input).toMatchObject({ outcome: "NOT_BAD", overriddenSources: [] });
    expect(input).not.toHaveProperty("correctedGrade");
  });

  it("opens the grading scale", () => {
    render(<ReviewRail details={details()} />);

    fireEvent.press(screen.getByText("View grading scale"));
    expect(screen.getByText("Specific notes and clarifications")).toBeTruthy();
  });

  it("shows a recorded outcome and lets the reviewer change it", () => {
    render(
      <ReviewRail
        details={details({
          reviews: makeReviews({
            CASE_NOTE: {
              status: "reviewed",
              latestOutcome: { ...outcome, notetakingPromptFollowUp: true },
              reopened: null,
            },
          }),
        })}
      />,
    );

    expect(screen.getByText("Reviewed")).toBeTruthy();
    expect(screen.getByText("Prompt follow-up: notetaking")).toBeTruthy();
    expect(
      screen.getByText("Confirmed BAD · Staff email pending"),
    ).toBeTruthy();
    expect(screen.getByText("Invented a UA refusal.")).toBeTruthy();
    expect(screen.queryByText("Record outcome")).toBeNull();

    fireEvent.press(screen.getByText("Change outcome"));

    expect(screen.getByText("Record outcome")).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: /Confirmed BAD/ }).props
        .accessibilityState.checked,
    ).toBe(true);
  });

  it("marks a pending staff email as sent from the detail page", () => {
    render(
      <ReviewRail
        details={details({
          reviews: makeReviews({
            CASE_NOTE: {
              status: "reviewed",
              latestOutcome: { ...outcome, followUp: "EMAIL_STAFF" },
              reopened: null,
            },
          }),
        })}
      />,
    );

    expect(screen.getByText("Staff email pending")).toBeTruthy();
    fireEvent.press(screen.getByText("Mark as sent"));
    expect(mockSetSent).toHaveBeenCalledWith({
      stateCode: "US_NE",
      outcomeId: "outcome-1",
      sent: true,
    });
  });

  it("undoes a sent staff email from the detail page", () => {
    render(
      <ReviewRail
        details={details({
          reviews: makeReviews({
            CASE_NOTE: {
              status: "reviewed",
              latestOutcome: {
                ...outcome,
                followUp: "EMAIL_STAFF",
                staffEmailSentAt: new Date("2026-09-12T12:00:00Z"),
                staffEmailSentBy: "admin@example.com",
              },
              reopened: null,
            },
          }),
        })}
      />,
    );

    expect(screen.queryByText("Mark as sent")).toBeNull();
    fireEvent.press(screen.getByText("Undo"));
    expect(mockSetSent).toHaveBeenCalledWith({
      stateCode: "US_NE",
      outcomeId: "outcome-1",
      sent: false,
    });
  });

  it("cancels a change without recording anything", () => {
    render(
      <ReviewRail
        details={details({
          reviews: makeReviews({
            CASE_NOTE: {
              status: "reviewed",
              latestOutcome: outcome,
              reopened: null,
            },
          }),
        })}
      />,
    );

    fireEvent.press(screen.getByText("Change outcome"));
    fireEvent.press(screen.getByRole("radio", { name: /Other \/ bug/ }));
    fireEvent.press(screen.getByText("Cancel"));

    expect(mockMutate).not.toHaveBeenCalled();
    expect(
      screen.getByText("Confirmed BAD · Staff email pending"),
    ).toBeTruthy();
    expect(screen.queryByText("Record outcome")).toBeNull();
  });

  it("offers no Cancel when nothing is recorded or the section reopened", () => {
    const { unmount } = render(<ReviewRail details={details()} />);
    expect(screen.queryByText("Cancel")).toBeNull();
    unmount();

    render(
      <ReviewRail
        details={details({
          reviews: makeReviews({
            CASE_NOTE: {
              status: "reopened",
              latestOutcome: outcome,
              reopened: { reason: "evaluation", at: null, by: null },
            },
          }),
        })}
      />,
    );
    expect(screen.queryByText("Cancel")).toBeNull();
  });

  it("explains why a section reopened, beside the earlier outcome", () => {
    render(
      <ReviewRail
        details={details({
          reviews: makeReviews({
            CASE_NOTE: {
              status: "reopened",
              latestOutcome: outcome,
              reopened: {
                reason: "thumbs_down",
                at: new Date("2026-09-12T12:00:00Z"),
                by: "staff@example.com",
              },
            },
          }),
        })}
      />,
    );

    expect(screen.getByText("Reopened")).toBeTruthy();
    expect(
      screen.getByText(
        /staff@example.com gave the case note a thumbs down on Sep 12, after the Sep 10, 2026 outcome \("Confirmed BAD · Staff email pending"\)\. Record a new outcome\./,
      ),
    ).toBeTruthy();
    expect(screen.getByText("Earlier outcome")).toBeTruthy();
    expect(screen.getByText("Record outcome")).toBeTruthy();
  });

  it("marks finished sections and moves to the next one after saving", async () => {
    const two = details({
      sections: {
        CASE_NOTE: { ...flag, llm: true },
        ACTION_ITEMS: { ...flag, vote: true },
        OVERALL: flag,
      },
      reviews: makeReviews({
        CASE_NOTE: {
          status: "reviewed",
          latestOutcome: outcome,
          reopened: null,
        },
        ACTION_ITEMS: {
          status: "needs_review",
          latestOutcome: null,
          reopened: null,
        },
      }),
    });
    render(<ReviewRail details={two} />);

    expect(screen.getByText("Case note ✓")).toBeTruthy();
    // It opens on the section still waiting for a review.
    expect(
      screen.getByText(
        "Action items flagged by in-app feedback. Record one outcome for each flagged section.",
      ),
    ).toBeTruthy();
  });

  it("confirms a save with a snackbar", async () => {
    render(<ReviewRail details={details()} />);

    await mockMutationOptions.onSuccess({}, { section: "CASE_NOTE" });

    expect(mockShowSnackbar).toHaveBeenCalledWith("Outcome recorded.");
  });
});
