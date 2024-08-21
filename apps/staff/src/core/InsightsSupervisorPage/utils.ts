// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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



import simplur from "simplur";

import { HighlightedOfficersDetail } from "../../InsightsStore/presenters/types";

export const highlightedOfficerText = (
  detail: HighlightedOfficersDetail,
  officerLabel: string,
) => {
  const names =
    detail.officerNames.length > 1
      ? detail.officerNames.slice(0, -1).join(", ") +
        ", and " +
        detail.officerNames.slice(-1)
      : detail.officerNames[0];
  return simplur`${names} ${[detail.numOfficers]} [is|are] in the top ${detail.topXPct}% of ${officerLabel}s in the state for highest ${detail.metricName} rate this year.`;
};
