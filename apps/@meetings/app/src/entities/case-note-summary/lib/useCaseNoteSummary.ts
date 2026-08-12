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

import { useMemo } from "react";

import { Person } from "~@meetings/app/shared/api";

import { CaseNoteInsightsSummary } from "../model/types";
import { getCaseNoteSummarySegments } from "./getCaseNoteSummarySegments";
import { getCategorizedSummaries } from "./getCategorizedSummaries";

export function useCaseNoteSummary(
  summaries: CaseNoteInsightsSummary[] | undefined,
  person: Person,
) {
  // Memoized so a template gap isn't re-reported to Sentry on every render —
  // the meeting modal's timer re-renders these consumers every second.
  return useMemo(() => {
    const categorized = getCategorizedSummaries(summaries);
    if (!categorized) return null;

    return getCaseNoteSummarySegments({ ...categorized, person });
  }, [summaries, person]);
}
