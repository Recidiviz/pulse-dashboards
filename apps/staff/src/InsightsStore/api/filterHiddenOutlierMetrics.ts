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

import { SupervisionOfficerOutcomes } from "~datatypes";

// Banner-only metrics that should not surface as negative outliers in Outcomes.
const HIDDEN_OUTLIER_METRIC_IDS: ReadonlySet<string> = new Set([
  "task_completions_early_discharge",
]);

export function filterHiddenOutlierMetrics(
  outcomes: SupervisionOfficerOutcomes,
): SupervisionOfficerOutcomes {
  return {
    ...outcomes,
    outlierMetrics: outcomes.outlierMetrics.filter(
      (m) => !HIDDEN_OUTLIER_METRIC_IDS.has(m.metricId),
    ),
  };
}
