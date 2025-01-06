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

import _ from "lodash";

import { CaseInsight } from "../../../../api";

type RecommendationType = NonNullable<
  CaseInsight["rollupRecidivismSeries"][0]["recommendationType"]
>;

export function getChartCaptions(insight: CaseInsight) {
  // Get all of the final (36 months in our case) data points for each recommendation type
  const finalDpsWithRecommendationType = insight.rollupRecidivismSeries.reduce(
    (
      acc: Array<{
        recommendationType: RecommendationType;
        eventRate: number;
        lowerCI: number;
        upperCI: number;
      }>,
      series,
    ) => {
      // TODO(https://github.com/Recidiviz/recidiviz-data/issues/35111): Handle cases were recommendationType is not set but sentence range is
      if (!series.recommendationType) {
        return acc;
      }

      const finalDp = _.last(
        [...series.dataPoints].sort((a, b) => a.cohortMonths - b.cohortMonths),
      );

      if (finalDp) {
        acc.push({
          recommendationType: series.recommendationType,
          eventRate: finalDp?.eventRate,
          lowerCI: finalDp?.lowerCI,
          upperCI: finalDp?.upperCI,
        });
      }

      return acc;
    },
    [],
  );

  const chartCaptions: Partial<Record<string, string[]>> = {};

  const lowestEventRateRecommendation = _.minBy(
    finalDpsWithRecommendationType,
    (dp) => dp.eventRate,
  );

  // Add caption for lowest event rate
  if (lowestEventRateRecommendation) {
    chartCaptions[lowestEventRateRecommendation.recommendationType] = [
      "Lowest recidivism rate.",
    ];
  }

  const overlappingIntervals: Partial<
    Record<RecommendationType, RecommendationType[]>
  > = {};

  // Figure out which recommendation types have overlapping confidence intervals for their final data points
  finalDpsWithRecommendationType.forEach((dp, i) => {
    // We only need to compare this data point with the ones that come after it, since we've already compared it with the ones that came before
    for (let j = i + 1; j < finalDpsWithRecommendationType.length; j++) {
      const otherDp = finalDpsWithRecommendationType[j];
      if (dp.lowerCI <= otherDp.upperCI && otherDp.lowerCI <= dp.upperCI) {
        overlappingIntervals[dp.recommendationType] =
          overlappingIntervals[dp.recommendationType] || [];
        overlappingIntervals[otherDp.recommendationType] =
          overlappingIntervals[otherDp.recommendationType] || [];

        overlappingIntervals[dp.recommendationType]?.push(
          otherDp.recommendationType,
        );
        overlappingIntervals[otherDp.recommendationType]?.push(
          dp.recommendationType,
        );
      }
    }
  });

  // Add captions for overlapping confidence intervals
  _.forEach(
    overlappingIntervals,
    (overlappingRecommendations, recommendationType) => {
      if (!overlappingRecommendations || !overlappingRecommendations.length) {
        return;
      }

      chartCaptions[recommendationType] =
        chartCaptions[recommendationType] || [];

      chartCaptions[recommendationType]?.push(
        `Confidence interval overlaps with ${overlappingRecommendations.join(" and ")}.`,
      );
    },
  );

  return _.transform(
    chartCaptions,
    (r: Partial<Record<string, string>>, v, k) => {
      r[k] = v?.join(" ");
    },
    {},
  );
}
