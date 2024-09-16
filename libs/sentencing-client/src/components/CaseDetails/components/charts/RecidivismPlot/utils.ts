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

import {
  areaY,
  axisX,
  axisY,
  dotY,
  lineY,
  plot,
  pointer,
  ruleY,
  selectMaxX,
  text,
  tip,
} from "@observablehq/plot";

import { CaseInsight } from "../../../../../api";
import { convertDecimalToPercentage } from "../../../../../utils/utils";
import { RecommendationType, SelectedRecommendation } from "../../../types";
import { RECOMMENDATION_TYPE_TO_COLOR } from "../common/constants";
import { getSubtitleGender, getSubtitleLsirScore } from "../common/utils";

export function stateCodeToStateName(
  stateCode: CaseInsight["rollupStateCode"],
) {
  return stateCode === "US_ID" ? "Idaho" : stateCode;
}

export function getRecidivismPlotSubtitle(insight: CaseInsight) {
  const {
    rollupStateCode,
    rollupGender,
    rollupAssessmentScoreBucketStart,
    rollupAssessmentScoreBucketEnd,
    rollupOffense,
    rollupNcicCategory,
    rollupCombinedOffenseCategory,
    rollupViolentOffense,
  } = insight;

  const genderString = getSubtitleGender(rollupGender);
  const lsirScoreString = getSubtitleLsirScore(
    rollupAssessmentScoreBucketStart,
    rollupAssessmentScoreBucketEnd,
  );

  const offenseString = rollupOffense ? `${rollupOffense} offenses` : undefined;
  const combinedOffenseString = rollupCombinedOffenseCategory
    ? `${rollupCombinedOffenseCategory} offenses`
    : undefined;
  const rollupNcicCategoryString = rollupNcicCategory
    ? `${rollupNcicCategory} offenses`
    : undefined;
  const rollupViolentOffenseString = rollupViolentOffense
    ? "Violent Offenses"
    : undefined;

  const recidivismSubtitleStrings = [
    genderString,
    lsirScoreString,
    offenseString,
    combinedOffenseString,
    rollupNcicCategoryString,
    rollupViolentOffenseString,
  ].filter((v) => v);

  return recidivismSubtitleStrings.length > 0
    ? recidivismSubtitleStrings.join(", ")
    : `All cases in ${stateCodeToStateName(rollupStateCode)}`;
}

const consolidateDuplicateLabels = (
  d: CaseInsight["rollupRecidivismSeries"][number]["dataPoints"][number],
  uniqueEndingEventRates: Set<number>,
  recommendationType: keyof typeof RecommendationType,
) => {
  const eventRatePercent = convertDecimalToPercentage(d.eventRate);
  if (d.cohortMonths === 36) {
    if (uniqueEndingEventRates.has(eventRatePercent)) {
      return { ...d, recommendationType, eventRate: null };
    }
    uniqueEndingEventRates.add(eventRatePercent);
  }
  return { ...d, recommendationType };
};

const PLOT_MARGIN_RIGHT = 42;
const PLOT_MARGIN_BOTTOM = 52;
const PLOT_HEIGHT_RATIO = 360 / 704;
const Y_TEXT_LABEL_OFFSET = 0.00099;

export function getRecidivismPlot(
  insight: CaseInsight,
  selectedRecommendation: SelectedRecommendation,
  plotWidth: number,
) {
  const series = insight.rollupRecidivismSeries;
  const uniqueEndingEventRates: Set<number> = new Set();
  const data = series.flatMap(({ recommendationType, dataPoints }) =>
    dataPoints.map((d) =>
      consolidateDuplicateLabels(d, uniqueEndingEventRates, recommendationType),
    ),
  );

  return plot({
    marginRight: PLOT_MARGIN_RIGHT,
    marginBottom: PLOT_MARGIN_BOTTOM,
    height: PLOT_HEIGHT_RATIO * plotWidth,
    width: plotWidth,
    y: {
      percent: true,
    },
    // The "white" fill is so that non-selected dots have a white fill
    color: {
      domain: [...Object.keys(RECOMMENDATION_TYPE_TO_COLOR), "white"],
      range: [...Object.values(RECOMMENDATION_TYPE_TO_COLOR), "#FFFFFF"],
    },
    marks: [
      lineY(data, {
        x: "cohortMonths",
        y: "eventRate",
        stroke: "recommendationType",
        strokeWidth: 3,
      }),
      areaY(data, {
        x: "cohortMonths",
        y1: "lowerCI",
        y2: "upperCI",
        fill: "recommendationType",
        fillOpacity: 0.2,
      }),
      dotY(data, {
        x: "cohortMonths",
        y: "eventRate",
        fill: (d) =>
          d.recommendationType === selectedRecommendation
            ? d.recommendationType
            : "white",
        stroke: "recommendationType",
        r: 6,
      }),
      tip(
        data,
        pointer({
          x: "cohortMonths",
          y: "eventRate",
          title: (d) => `${Math.round(d.eventRate * 100)}%`,
        }),
      ),
      text(
        data,
        selectMaxX({
          x: "cohortMonths",
          // y is slightly offset to avoid labels overlapping for datapoints that are close to each other
          y: (d, i) => d.eventRate + i * Y_TEXT_LABEL_OFFSET - 0.01,
          z: "recommendationType",
          text: (d) => d.eventRate && `${Math.round(d.eventRate * 100)}%`,
          dx: 25,
          fontFamily: "Public Sans",
          fontSize: 14,
          fill: "#001133B2",
        }),
      ),
      axisX({
        label: "Months since release",
        labelAnchor: "center",
        labelArrow: false,
        labelOffset: 40,
        ticks: [0, 3, 6, 9, 12, 18, 24, 30, 36],
        tickSize: 0,
        tickFormat: "",
        fontSize: 14,
        fontWeight: 400,
        color: "#001133B2",
      }),
      axisY({
        tickFormat: (y) => `${y}%`,
        tickSize: 0,
        interval: 10,
        fontSize: 14,
        fontWeight: 400,
        color: "#001133B2",
      }),
      // Adds a horizontal line a y = 0
      ruleY([0]),
    ],
  });
}
