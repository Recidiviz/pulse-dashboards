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
  pointerX,
  ruleX,
  ruleY,
  text,
  tip,
} from "@observablehq/plot";
import { palette } from "@recidiviz/design-system";

import { CaseInsight } from "../../../../../../api";
import { convertDecimalToPercentage } from "../../../../../../utils/utils";
import { SelectedRecommendation } from "../../../../types";
import { SENTENCE_TYPE_TO_COLOR } from "../../common/constants";
import { getSubtitleGender, getSubtitleLsirScore } from "../../common/utils";

export function getRecidivismPlotSubtitle(insight: CaseInsight) {
  const {
    rollupOffenseDescription,
    rollupGender,
    rollupAssessmentScoreBucketStart,
    rollupAssessmentScoreBucketEnd,
  } = insight;

  const genderString = getSubtitleGender(rollupGender);
  const lsirScoreString = getSubtitleLsirScore(
    rollupAssessmentScoreBucketStart,
    rollupAssessmentScoreBucketEnd,
  );

  return [genderString, lsirScoreString, rollupOffenseDescription]
    .filter((v) => v)
    .join(", ");
}

const PLOT_MARGIN_RIGHT = 42;
const PLOT_MARGIN_BOTTOM = 52;
const PLOT_HEIGHT_RATIO = 445 / 704;

export function getRecidivismPlot(
  insight: CaseInsight,
  selectedRecommendation: SelectedRecommendation,
  plotWidth: number,
) {
  const { rollupRecidivismSeries } = insight;

  const transformedSeries = rollupRecidivismSeries.map((series) => ({
    ...series,
    dataPoints: series.dataPoints.map((dataPoint) => ({
      ...dataPoint,
      eventRate: convertDecimalToPercentage(dataPoint.eventRate),
      lowerCI: convertDecimalToPercentage(dataPoint.lowerCI),
      upperCI: convertDecimalToPercentage(dataPoint.upperCI),
    })),
  }));

  const endingEventRates = transformedSeries.reduce(
    (acc, series) => {
      const lastDataPoint = series.dataPoints.sort(
        (a, b) => a.cohortMonths - b.cohortMonths,
      )[series.dataPoints.length - 1];
      acc.push({
        cohortMonths: lastDataPoint.cohortMonths,
        eventRate: lastDataPoint.eventRate,
      });
      return acc;
    },
    <{ cohortMonths: number; eventRate: number }[]>[],
  );

  const data = transformedSeries.flatMap(({ recommendationType, dataPoints }) =>
    dataPoints.map((d) => ({ ...d, recommendationType })),
  );

  return plot({
    marginRight: PLOT_MARGIN_RIGHT,
    marginBottom: PLOT_MARGIN_BOTTOM,
    height: PLOT_HEIGHT_RATIO * plotWidth,
    width: plotWidth,
    // The "white" fill is so that non-selected dots have a white fill
    color: {
      domain: [...Object.keys(SENTENCE_TYPE_TO_COLOR), "white"],
      range: [...Object.values(SENTENCE_TYPE_TO_COLOR), "#FFFFFF"],
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

      text(endingEventRates, {
        x: "cohortMonths",
        y: (d) => d.eventRate,
        text: (d) => d.eventRate && `${d.eventRate}%`,
        dx: 25,
        fontFamily: "Public Sans",
        fontSize: 14,
        fill: "#001133B2",
      }),
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
      ruleX(
        data,
        pointerX({
          x: "cohortMonths",
          py: "eventRate",
          strokeWidth: 1,
          stroke: palette.slate30,
          strokeDasharray: "4",
        }),
      ),
      tip(
        data,
        pointer({
          x: "cohortMonths",
          y: "eventRate",
          title: (d) =>
            `${d.cohortMonths} Months\n\n${d.recommendationType}: ${d.eventRate}%`,
        }),
      ),
    ],
  });
}
