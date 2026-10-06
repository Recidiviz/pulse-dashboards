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

import type { FlaggedMeetingSummary } from "~@meetings/app/admin/api/flaggedMeetings";
import type { StatusTone } from "~@meetings/app/admin/ui/StatusBadge";

export type BadgeSpec = { label: string; tone: StatusTone; dot?: boolean };

const GRADE_DIMENSIONS = [
  ["caseNote", "Case note"],
  ["actionItems", "Action items"],
  ["overall", "Overall"],
] as const;

type Grades = Partial<Record<(typeof GRADE_DIMENSIONS)[number][0], string>>;

const WORST_FIRST: { grade: string; badge: BadgeSpec }[] = [
  { grade: "PARTIAL", badge: { label: "Partial", tone: "partial", dot: true } },
  { grade: "GOOD", badge: { label: "Good", tone: "good", dot: true } },
  { grade: "N/A", badge: { label: "N/A", tone: "neutral" } },
];

/** One badge per BAD dimension, else the worst grade given. */
export function gradeBadges(grades: Grades): BadgeSpec[] {
  const bad = GRADE_DIMENSIONS.filter(([key]) => grades[key] === "BAD");
  if (bad.length > 0) {
    return bad.map(([, label]) => ({
      label: `Bad · ${label}`,
      tone: "bad",
      dot: true,
    }));
  }
  const given = Object.values(grades);
  const worst = WORST_FIRST.find(({ grade }) => given.includes(grade));
  return [worst?.badge ?? { label: "No grade", tone: "neutral" }];
}

export function llmBadges(llm: FlaggedMeetingSummary["llm"]): BadgeSpec[] {
  if (!llm) return [{ label: "Not evaluated", tone: "neutral" }];
  return gradeBadges(llm.grades);
}

/** Null renders as a dash, for environments without Label Studio. */
export function labelStudioBadges(
  labelStudio: FlaggedMeetingSummary["labelStudio"],
): BadgeSpec[] | null {
  if (!labelStudio) return null;
  if (labelStudio.status === "not_sent") {
    return [{ label: "Not sent", tone: "neutral" }];
  }
  if (labelStudio.status === "not_rated") {
    return [{ label: "Sent · not rated yet", tone: "neutral" }];
  }
  const badges = gradeBadges(labelStudio.combined);
  if (labelStudio.raterCount > 1) {
    badges.push({ label: `${labelStudio.raterCount} raters`, tone: "neutral" });
  }
  return badges;
}

const VOTE_TAB_LABEL: Record<
  FlaggedMeetingSummary["votes"][number]["tab"],
  string
> = {
  DRAFT_CASE_NOTES: "Case note",
  ACTION_ITEMS: "Action items",
  STAFF_FEEDBACK: "Overall",
};

export function feedbackBadges(
  votes: FlaggedMeetingSummary["votes"],
): BadgeSpec[] {
  const down = votes.filter((v) => v.vote === "DOWN");
  if (down.length > 0) {
    return down.map((v) => ({
      label: `Thumbs down · ${VOTE_TAB_LABEL[v.tab]}`,
      tone: "bad",
    }));
  }
  if (votes.some((v) => v.vote === "UP")) {
    return [{ label: "Thumbs up", tone: "good" }];
  }
  return [{ label: "None", tone: "neutral" }];
}
