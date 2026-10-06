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

import type {
  FlaggedMeetingDetails,
  FlagSection,
  RecordOutcomeInput,
  ReviewOutcomeSummary,
} from "~@meetings/app/admin/api/flaggedMeetings";

export type OutcomeKind = ReviewOutcomeSummary["outcome"];
export type FollowUp = NonNullable<ReviewOutcomeSummary["followUp"]>;
export type OverrideSource = ReviewOutcomeSummary["overriddenSources"][number];
export type CoveredSection = "CASE_NOTE" | "ACTION_ITEMS";

/** What the reviewer has picked so far in the rail. */
export interface ReviewDraft {
  outcome: OutcomeKind | null;
  followUp: FollowUp;
  correctedGrade: "GOOD" | "PARTIAL";
  overriddenSources: OverrideSource[];
  /** Null until the reviewer answers; empty means "neither section". */
  appliesTo: CoveredSection[] | null;
  notes: string;
}

const SECTION_DIMENSION = {
  CASE_NOTE: "caseNote",
  ACTION_ITEMS: "actionItems",
  OVERALL: "overall",
} as const satisfies Record<FlagSection, string>;

/**
 * The ratings a reviewer can override on a section: every source that rated
 * it, not only the ones that flagged it, since a Partial can be corrected to
 * Good too. `flagged` is the subset that flagged the section, which a Not BAD
 * outcome overrides by default.
 */
export function overridableSources(
  details: Pick<FlaggedMeetingDetails, "llm" | "labelStudio" | "sections">,
  section: FlagSection,
): { rated: OverrideSource[]; flagged: OverrideSource[] } {
  const dimension = SECTION_DIMENSION[section];
  const flag = details.sections[section];
  const llmRated = details.llm?.dimensions.some((d) => d.key === dimension);
  const grade = details.labelStudio?.combined[dimension].grade;
  const lsRated = grade !== null && grade !== undefined && grade !== "N/A";

  const rated: OverrideSource[] = [
    ...(llmRated || flag.llm ? (["LLM_JUDGE"] as const) : []),
    ...(lsRated || flag.labelStudio ? (["LABEL_STUDIO"] as const) : []),
  ];
  return {
    rated,
    flagged: rated.filter((s) =>
      s === "LLM_JUDGE" ? flag.llm : flag.labelStudio,
    ),
  };
}

export function emptyDraft(sources: OverrideSource[]): ReviewDraft {
  return {
    outcome: null,
    followUp: "NO_ACTION",
    correctedGrade: "GOOD",
    // Overriding everything that flagged it is the usual reason to say Not BAD.
    overriddenSources: sources,
    appliesTo: null,
    notes: "",
  };
}

/** A draft to edit, starting from a recorded outcome. */
export function draftFromOutcome(outcome: ReviewOutcomeSummary): ReviewDraft {
  return {
    outcome: outcome.outcome,
    followUp: outcome.followUp ?? "NO_ACTION",
    correctedGrade: outcome.correctedGrade ?? "GOOD",
    overriddenSources: outcome.overriddenSources,
    appliesTo: outcome.appliesTo.filter(
      (s): s is CoveredSection => s !== "OVERALL",
    ),
    notes: outcome.notes ?? "",
  };
}

function needsAppliesTo(section: FlagSection, draft: ReviewDraft): boolean {
  return (
    section === "OVERALL" &&
    (draft.outcome === "CONFIRMED_BAD" || draft.outcome === "NOT_BAD")
  );
}

export function canSave(section: FlagSection, draft: ReviewDraft): boolean {
  if (!draft.outcome) return false;
  if (needsAppliesTo(section, draft) && draft.appliesTo === null) return false;
  // The Other outcome is for a bug report, which the notes must describe.
  if (draft.outcome === "OTHER" && draft.notes.trim() === "") return false;
  return true;
}

/** The mutation input for a draft, or null when it is not ready to save. */
export function toRecordInput({
  stateCode,
  meetingId,
  section,
  draft,
}: {
  stateCode: FlaggedMeetingDetails["stateCode"];
  meetingId: string;
  section: FlagSection;
  draft: ReviewDraft;
}): RecordOutcomeInput | null {
  if (!canSave(section, draft) || !draft.outcome) return null;
  const base = {
    stateCode,
    meetingId,
    section,
    ...(draft.notes.trim() && { notes: draft.notes.trim() }),
  };
  const appliesTo = needsAppliesTo(section, draft)
    ? { appliesTo: draft.appliesTo ?? [] }
    : {};

  switch (draft.outcome) {
    case "CONFIRMED_BAD":
      return {
        ...base,
        ...appliesTo,
        outcome: "CONFIRMED_BAD",
        followUp: draft.followUp,
      };
    case "NOT_BAD":
      return {
        ...base,
        ...appliesTo,
        outcome: "NOT_BAD",
        correctedGrade: draft.correctedGrade,
        overriddenSources: draft.overriddenSources,
        // "User caught it" describes a real BAD; a Not BAD flag was never wrong output.
        followUp: draft.followUp === "EMAILED_PO" ? "EMAILED_PO" : "NO_ACTION",
      };
    case "OTHER":
      return {
        ...base,
        outcome: "OTHER",
        notes: draft.notes.trim(),
      };
  }
}
