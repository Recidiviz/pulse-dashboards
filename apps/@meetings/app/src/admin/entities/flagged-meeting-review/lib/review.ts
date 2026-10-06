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

import { format } from "date-fns";

import type {
  FlagSection,
  ReviewOutcomeSummary,
  SectionReview,
  SectionReviews,
} from "~@meetings/app/admin/api/flaggedMeetings";
import type { StatusTone } from "~@meetings/app/admin/ui/StatusBadge";

export const SECTION_ORDER: FlagSection[] = [
  "CASE_NOTE",
  "ACTION_ITEMS",
  "OVERALL",
];

export const SECTION_LABEL: Record<FlagSection, string> = {
  CASE_NOTE: "Case note",
  ACTION_ITEMS: "Action items",
  OVERALL: "Overall",
};

const FOLLOW_UP_LABEL: Record<
  NonNullable<ReviewOutcomeSummary["followUp"]>,
  string
> = {
  NO_ACTION: "no action",
  USER_CAUGHT_IT: "user caught it",
  EMAILED_PO: "emailed the PO",
};

const SOURCE_LABEL: Record<
  ReviewOutcomeSummary["overriddenSources"][number],
  string
> = { LLM_JUDGE: "LLMAJ", LABEL_STUDIO: "LS" };

const GRADE_LABEL = { GOOD: "Good", PARTIAL: "Partial" } as const;

/** The sections a review covers: every flagged one, plus any a reviewer has already recorded. */
export function reviewableSections(reviews: SectionReviews): FlagSection[] {
  return SECTION_ORDER.filter((s) => reviews[s].status !== "not_flagged");
}

export function isSectionDone(review: SectionReview): boolean {
  return review.status === "reviewed";
}

/** A one-line summary of a recorded outcome, as shown in the list and the rail. */
export function outcomeLabel(
  outcome: ReviewOutcomeSummary,
  section: FlagSection,
): string {
  // Only an Overall outcome says which sections it covers; none means neither.
  const covers =
    section === "OVERALL" && outcome.outcome !== "OTHER"
      ? ` · ${
          outcome.appliesTo.length === 0
            ? "neither section"
            : outcome.appliesTo
                .map((s) => SECTION_LABEL[s].toLowerCase())
                .join(" + ")
        }`
      : "";

  if (outcome.outcome === "CONFIRMED_BAD") {
    const follow = outcome.followUp
      ? ` · ${FOLLOW_UP_LABEL[outcome.followUp]}`
      : "";
    return `Confirmed BAD${covers}${follow}`;
  }
  if (outcome.outcome === "NOT_BAD") {
    const grade = outcome.correctedGrade
      ? ` → ${GRADE_LABEL[outcome.correctedGrade]}`
      : "";
    const overrides =
      outcome.overriddenSources.length > 0
        ? ` · overrides ${outcome.overriddenSources.map((s) => SOURCE_LABEL[s]).join(" + ")}`
        : "";
    const emailed = outcome.followUp === "EMAILED_PO" ? " · emailed PO" : "";
    return `Not BAD${grade}${covers}${overrides}${emailed}`;
  }
  return "Other / bug";
}

function outcomeTone(outcome: ReviewOutcomeSummary): StatusTone {
  return outcome.outcome === "CONFIRMED_BAD" ? "bad" : "info";
}

const REOPEN_SHORT: Record<
  NonNullable<SectionReview["reopened"]>["reason"],
  string
> = {
  label_studio: "new Label Studio rating",
  thumbs_down: "new thumbs down",
  evaluation: "new judge rating",
  outputs_regenerated: "notes regenerated",
};

/** Why a section is back in the queue, as a sentence for the review rail. */
export function reopenSentence(
  section: FlagSection,
  reopened: NonNullable<SectionReview["reopened"]>,
): string {
  const label = SECTION_LABEL[section].toLowerCase();
  const on = reopened.at ? ` on ${format(reopened.at, "MMM d")}` : "";
  const who = reopened.by ?? "Someone";
  switch (reopened.reason) {
    case "label_studio":
      return `${who} rated the ${label} Bad${on}`;
    case "thumbs_down":
      return `${who} gave the ${label} a thumbs down${on}`;
    case "evaluation":
      return `The LLM judge rated the ${label} Bad${on}`;
    case "outputs_regenerated":
      return "The meeting's notes were regenerated";
  }
}

export interface MeetingReviewState {
  /** Every section has an outcome and none has reopened. */
  reviewed: boolean;
  label: string;
  tone: StatusTone;
}

/** Where a whole meeting stands, for the Outcome column and the tabs. */
export function meetingReviewState(
  reviews: SectionReviews,
): MeetingReviewState {
  const sections = reviewableSections(reviews);
  const reopened = sections.find((s) => reviews[s].status === "reopened");
  if (reopened) {
    const reason = reviews[reopened].reopened?.reason;
    return {
      reviewed: false,
      label: `Reopened · ${reason ? REOPEN_SHORT[reason] : "new activity"}`,
      tone: "bad",
    };
  }

  const done = sections.filter((s) => isSectionDone(reviews[s])).length;
  if (done === 0) {
    return { reviewed: false, label: "Needs review", tone: "partial" };
  }
  if (done < sections.length) {
    return {
      reviewed: false,
      label: `${done} of ${sections.length} reviewed`,
      tone: "partial",
    };
  }
  if (sections.length > 1) {
    return {
      reviewed: true,
      label: `${sections.length} outcomes`,
      tone: "info",
    };
  }
  const only = reviews[sections[0]].latestOutcome;
  return only
    ? {
        reviewed: true,
        label: outcomeLabel(only, sections[0]),
        tone: outcomeTone(only),
      }
    : { reviewed: true, label: "Reviewed", tone: "info" };
}

export function isNeedsReview(reviews: SectionReviews): boolean {
  return !meetingReviewState(reviews).reviewed;
}
