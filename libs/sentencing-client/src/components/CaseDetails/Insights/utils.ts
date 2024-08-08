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

import { Insight } from "../../../api/APIClient";
import { SelectedRecommendation } from "../types";
import { RECOMMENDATION_TYPE_TO_COLOR } from "./constants";

const PLOT_MARGIN_RIGHT = 40;
const PLOT_MARGIN_BOTTOM = 40;
const PLOT_HEIGHT = 360;
const PLOT_WIDTH = 704;

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
    marginBottom: PLOT_MARGIN_BOTTOM,
    height: PLOT_HEIGHT,
    width: PLOT_WIDTH,
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
          y: "eventRate",
          z: "recommendationType",
          text: (d) => `${Math.round(d.eventRate * 100)}%`,
          dx: 25,
          fontFamily: "Public Sans",
          fontSize: 14,
          fill: "#001133B2",
        }),
      ),
      axisX({
        label: "Months",
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
