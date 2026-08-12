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

import { CaseNoteSummarySegment } from "../model/types";

export type Word = { text: string; segmentIndex: number; isCited: boolean };

/**
 * Splits segments into individual words so a cited phrase can wrap across lines
 */
export function toWords(segments: CaseNoteSummarySegment[]): Word[] {
  return segments.flatMap((segment, segmentIndex) => {
    const isCited = !!segment.citation;
    const lead = isCited ? segment.content.match(/^\s+/)?.[0] : undefined;
    const rest = segment.content.slice(lead?.length ?? 0);

    return [
      ...(lead ? [{ text: lead, segmentIndex, isCited: false }] : []),
      ...(rest.match(/\s*\S+\s*/g) ?? [rest]).map((text) => ({
        text,
        segmentIndex,
        isCited,
      })),
    ];
  });
}
