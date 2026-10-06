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
  FlaggedMeetingSummary,
  FlagSection,
} from "~@meetings/app/admin/api/flaggedMeetings";

export type FlaggedBy = "any" | "llm" | "labelStudio" | "vote";
export type DimensionFilter = "any" | FlagSection;

/**
 * Narrows already-fetched rows. Dimension alone matches a section flagged by
 * any source; with a source too, that source must have flagged that section.
 */
export function filterFlaggedMeetings(
  meetings: FlaggedMeetingSummary[],
  flaggedBy: FlaggedBy,
  dimension: DimensionFilter,
): FlaggedMeetingSummary[] {
  if (flaggedBy === "any" && dimension === "any") return meetings;

  return meetings.filter((meeting) => {
    const sections =
      dimension === "any"
        ? Object.values(meeting.sections)
        : [meeting.sections[dimension]];
    return sections.some((section) =>
      flaggedBy === "any"
        ? section.llm || section.labelStudio || section.vote
        : section[flaggedBy],
    );
  });
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Keeps the meetings held in the last `days` days. */
export function withinLookback(
  meetings: FlaggedMeetingSummary[],
  days: number,
  now: Date = new Date(),
): FlaggedMeetingSummary[] {
  const since = now.getTime() - days * MS_PER_DAY;
  return meetings.filter((meeting) => meeting.startTime.getTime() >= since);
}
