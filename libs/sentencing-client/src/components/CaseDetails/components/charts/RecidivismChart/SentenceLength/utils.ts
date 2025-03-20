// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
  axisX,
  axisY,
  dot,
  gridX,
  gridY,
  plot,
  pointerY,
  rectX,
  tip,
} from "@observablehq/plot";

import { CaseInsight } from "../../../../../../api";
import { convertDecimalToPercentage } from "../../../../../../utils/utils";
import { SENTENCE_TYPE_TO_COLOR } from "../../common/constants";
import {
  getSentenceLengthBucketLabel,
  getSubtitleGender,
  getSubtitleLsirScore,
  sortDataForSentenceLengthCharts,
} from "../../common/utils";

const PLOT_HEIGHT_MULTIPLIER = 70;
const DOT_RADIUS = 13;
const RECT_INSET = 16;

function getTooltip(d: {
  eventRate: number;
  upperCI: number;
  lowerCI: number;
  name: string;
  cohortMonths: number;
}) {
  const formattedEventRate = convertDecimalToPercentage(d.eventRate);

  // The confidence interval is the larger of the two differences between the event rate and the upper/lower CI. This is because it's possible that either interval crosses 0 or 100 and will be cut off, so the larger of the two will be the correct one
  const formattedConfidenceInterval = Math.max(
    convertDecimalToPercentage(d.upperCI - d.eventRate),
    convertDecimalToPercentage(d.eventRate - d.lowerCI),
  );
  return `${d.name} (${formattedEventRate}%)\n\nThe Cumulative Recidivism Rate is ${formattedEventRate}% for sentences of ${d.name} at ${d.cohortMonths} months. This statistic has a confidence interval of ± ${formattedConfidenceInterval}%. `;
}

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

const PLOT_MARGIN_LEFT = 80;

export function getRecidivismPlot(
  insight: CaseInsight,
  plotWidth: number,
  isFocused = true,
  forReport = false,
) {
  const { rollupRecidivismSeries } = insight;

  const transformedSeries = sortDataForSentenceLengthCharts(
    rollupRecidivismSeries,
  ).map((series) => {
    const {
      dataPoints,
      sentenceLengthBucketStart,
      sentenceLengthBucketEnd,
      recommendationType,
    } = series;

    const name = getSentenceLengthBucketLabel(
      recommendationType,
      sentenceLengthBucketStart,
      sentenceLengthBucketEnd,
    );

    const lastDataPoint = dataPoints.sort(
      (a, b) => a.cohortMonths - b.cohortMonths,
    )[series.dataPoints.length - 1];

    return {
      name,
      ...lastDataPoint,
    };
  });

  // The data has been sorted properly, so set the yDomain to follow its sort order
  const yDomain = transformedSeries.map((series) => series.name);

  // Make the domain the closest 5% multiple on either end of the min and max values
  const xDomainStart =
    Math.floor(
      Math.min(...transformedSeries.map((series) => series.lowerCI)) * 20,
    ) * 5;
  const xDomainEnd =
    Math.ceil(
      Math.max(...transformedSeries.map((series) => series.upperCI)) * 20,
    ) * 5;

  const margin = forReport ? 0 : 200;

  return plot({
    width: plotWidth,
    height: margin + 10 + PLOT_HEIGHT_MULTIPLIER * transformedSeries.length,
    marginLeft: PLOT_MARGIN_LEFT,
    marginBottom: margin,
    color: {
      domain: [...Object.keys(SENTENCE_TYPE_TO_COLOR)],
      range: [...Object.values(SENTENCE_TYPE_TO_COLOR)],
    },
    x: {
      percent: true,
      domain: [xDomainStart, xDomainEnd],
    },
    y: {
      domain: yDomain,
    },
    marks: [
      axisY({
        label: null,
        tickSize: 0,
        color: "#171C2B",
        fontSize: 14,
      }),
      axisX({
        label: null,
        tickFormat: (d) => `${d}%`,
        tickSize: 0,
        interval: 10,
        color: "#001133B2",
        fontWeight: 400,
        fontSize: 14,
      }),
      gridX({
        stroke: "#E9EDEF",
        strokeOpacity: 1,
      }),
      gridY({ stroke: "#E9EDEF", strokeOpacity: 1 }),
      rectX(transformedSeries, {
        x1: "lowerCI",
        x2: "upperCI",
        y: "name",
        insetBottom: RECT_INSET,
        insetTop: RECT_INSET,
        fill: "#2B54691A",
        opacity: isFocused && !forReport ? 0.3 : 1,
      }),
      forReport
        ? null
        : rectX(
            transformedSeries,
            pointerY({
              x1: "lowerCI",
              x2: "upperCI",
              y: "name",
              insetBottom: RECT_INSET,
              insetTop: RECT_INSET,
              fill: "#2B54691A",
            }),
          ),
      dot(transformedSeries, {
        x: "eventRate",
        y: "name",
        fill: forReport ? "#001F1F" : "name",
        r: DOT_RADIUS,
        opacity: isFocused && !forReport ? 0.3 : 1,
      }),
      forReport
        ? null
        : dot(
            transformedSeries,
            pointerY({
              x: "eventRate",
              y: "name",
              r: DOT_RADIUS,
              fill: "name",
            }),
          ),
      forReport
        ? null
        : tip(
            transformedSeries,
            pointerY({
              x: "eventRate",
              y: "name",
              title: getTooltip,
              fontSize: 12,
              fontFamily: "Public Sans",
            }),
          ),
    ],
  });
}
