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

import { Person, trpc } from "~@meetings/app/shared/api";
import { IS_PROD } from "~@meetings/app/shared/config";

import { getCaseNoteSummarySegments } from "./getCaseNoteSummarySegments";
import { getCategorizedSummaries } from "./getCategorizedSummaries";

type Params = {
  person: Person;
  isClient: boolean;
  showCNI: boolean;
};

export function useCaseNoteSummary({ person, isClient, showCNI }: Params) {
  const enabled = isClient && showCNI && !IS_PROD;

  const { data: client } = trpc.v1.client.get.useQuery(
    { personId: person.personId },
    { enabled },
  );
  const summaries = client?.caseNoteInsightsSummaries;

  // Memoized so a template gap isn't re-reported to Sentry on every render —
  // the meeting modal's timer re-renders these consumers every second.
  const segments = useMemo(() => {
    if (!enabled) return null;

    const categorized = getCategorizedSummaries(summaries);
    if (!categorized) return null;

    return getCaseNoteSummarySegments({ ...categorized, person });
  }, [summaries, person, enabled]);

  return { segments, summaries, enabled };
}
