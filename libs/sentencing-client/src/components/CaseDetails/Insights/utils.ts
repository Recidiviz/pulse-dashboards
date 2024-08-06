import {
  areaY,
  axisX,
  axisY,
  dotY,
  lineY,
  plot,
  ruleY,
  selectMaxX,
  text,
} from "@observablehq/plot";

import { Insight } from "../../../api/APIClient";
import { SelectedRecommendation } from "../types";
import { RECOMMENDATION_TYPE_TO_COLOR } from "./constants";

const PLOT_MARGIN_RIGHT = 30;

export function getRecidivismPlot(
  insight: Insight,
  selectedRecommendation: SelectedRecommendation,
) {
  const series = insight.rollupRecidivismSeries;

  const data = series.flatMap(({ recommendationType, dataPoints }) =>
    dataPoints.map((d) => ({ ...d, recommendationType })),
  );

  return plot({
    marginRight: PLOT_MARGIN_RIGHT,
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
      text(
        data,
        selectMaxX({
          x: "cohortMonths",
          y: "eventRate",
          z: "recommendationType",
          text: (d) => `${d.eventRate * 100}%`,
          fillOpacity: 0.5,
          dx: 20,
        }),
      ),
      axisX({
        ticks: [0, 3, 6, 9, 12, 18, 24, 30, 36],
        tickSize: 0,
        tickFormat: "",
        label: null,
      }),
      axisY({
        tickFormat: (y) => `${y}%`,
        tickSize: 0,
        interval: 10,
      }),
      // Adds a horizontal line a y = 0
      ruleY([0]),
    ],
  });
}

export function getRecidivismPlotSubtitle(insight: Insight) {
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

  const genderString = rollupGender ? `${rollupGender}s` : undefined;
  const lsirScoreString =
    rollupAssessmentScoreBucketStart !== null &&
    rollupAssessmentScoreBucketEnd !== null
      ? `LSI-R = ${rollupAssessmentScoreBucketStart}-${rollupAssessmentScoreBucketEnd}`
      : undefined;

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
    : `All cases in ${rollupStateCode}`;
}
