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

import { formatLargeNumber, formatPercent } from "../../utils/formatStrings";
import { tooltipWithoutTrendlineLabel } from "../../utils/tooltips";
import { isDenominatorStatisticallySignificant } from "./significantStatistics";

export function tooltipForRateMetricWithCounts(
  id,
  tooltipItem,
  data,
  numerators,
  denominators,
  includeWarning,
  includePercentage,
) {
  const { datasetIndex, index: dataPointIndex } = tooltipItem;
  const label = data.datasets[datasetIndex].label || "";
  const isNested = Array.isArray(numerators[datasetIndex]);
  const numerator = isNested
    ? numerators[datasetIndex][dataPointIndex]
    : numerators[dataPointIndex];
  const denominator = isNested
    ? denominators[datasetIndex][dataPointIndex]
    : denominators[dataPointIndex];
  let appendedCounts = "";
  if (numerator !== undefined && Boolean(denominator)) {
    const percentage = includePercentage
      ? `${formatPercent((numerator / denominator) * 100)} `
      : "";
    appendedCounts = ` ${percentage}(${formatLargeNumber(
      numerator,
    )}/${formatLargeNumber(denominator)})`;
  }

  const cue =
    includeWarning && !isDenominatorStatisticallySignificant(denominator)
      ? " *"
      : "";

  return id.includes("Race") || id.includes("Gender") || id.includes("Sex")
    ? `${tooltipWithoutTrendlineLabel(
        tooltipItem,
        data,
        "",
      )}${appendedCounts}${cue}`
    : `${label}: ${tooltipWithoutTrendlineLabel(
        tooltipItem,
        data,
        "%",
      )}${appendedCounts}${cue}`;
}
