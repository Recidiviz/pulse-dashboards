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
} from "@observablehq/plot";

import { CaseInsight } from "../../../../../../api";
import { SENTENCE_TYPE_TO_COLOR } from "../../common/constants";
import {
  getSentenceLengthBucketText,
  getSubtitleGender,
  getSubtitleLsirScore,
} from "../../common/utils";

const PLOT_HEIGHT_MULTIPLIER = 70;
const DOT_RADIUS = 13;
const RECT_INSET = 16;

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

function sentenceLengthLabelFilter(d: {
  sentenceLengthBucketStart: number;
  sentenceLengthBucketEnd: number;
}) {
  return d.sentenceLengthBucketStart === 0 && d.sentenceLengthBucketEnd === -1;
}

export function getRecidivismPlot(
  insight: CaseInsight,
  plotWidth: number,
  isFocused = true,
) {
  const { rollupRecidivismSeries } = insight;

  const transformedSeries = rollupRecidivismSeries.map((series) => {
    const {
      dataPoints,
      sentenceLengthBucketStart,
      sentenceLengthBucketEnd,
      recommendationType,
    } = series;

    const name = getSentenceLengthBucketText(
      recommendationType,
      sentenceLengthBucketStart,
      sentenceLengthBucketEnd,
    );

    const lastDataPoint = dataPoints.sort(
      (a, b) => a.cohortMonths - b.cohortMonths,
    )[series.dataPoints.length - 1];

    return {
      name,
      sentenceLengthBucketStart,
      sentenceLengthBucketEnd,
      ...lastDataPoint,
    };
  });

  // The order of the y domain should first be sentence type labels, then the sentence length labels ordered by start value
  const yDomain = [
    ...transformedSeries.filter(sentenceLengthLabelFilter).map((d) => d.name),
    ...transformedSeries
      .filter((d) => !sentenceLengthLabelFilter(d))
      .sort((a, b) => a.sentenceLengthBucketStart - b.sentenceLengthBucketStart)
      .map((d) => d.name),
  ];

  // Make the domain the closest 5% multiple on either end of the min and max values
  const domainStart =
    Math.floor(
      Math.min(...transformedSeries.map((series) => series.lowerCI)) * 20,
    ) * 5;
  const domainEnd =
    Math.ceil(
      Math.max(...transformedSeries.map((series) => series.upperCI)) * 20,
    ) * 5;

  return plot({
    width: plotWidth,
    height: 35 + PLOT_HEIGHT_MULTIPLIER * transformedSeries.length,
    marginLeft: PLOT_MARGIN_LEFT,
    color: {
      domain: [...Object.keys(SENTENCE_TYPE_TO_COLOR), "white"],
      range: [...Object.values(SENTENCE_TYPE_TO_COLOR), "#FFFFFF"],
    },
    x: {
      percent: true,
      domain: [domainStart, domainEnd],
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
        opacity: isFocused ? 0.3 : 1,
      }),
      rectX(
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
        fill: "name",
        r: DOT_RADIUS,
        opacity: isFocused ? 0.3 : 1,
      }),
      dot(
        transformedSeries,
        pointerY({
          x: "eventRate",
          y: "name",
          r: DOT_RADIUS,
          fill: "name",
        }),
      ),
    ],
  });
}
