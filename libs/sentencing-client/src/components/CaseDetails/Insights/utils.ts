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

const PLOT_WIDTH = 734;
const PLOT_HEIGHT = 313;
const PLOT_MARGIN_RIGHT = 30;

export function getPlot(
  insight: NonNullable<Insight>,
  selectedRecommendation: SelectedRecommendation,
) {
  const series = insight.rollupRecidivismSeries;

  const data = series.flatMap(({ recommendationType, dataPoints }) =>
    dataPoints.map((d) => ({ ...d, recommendationType })),
  );

  return plot({
    width: PLOT_WIDTH,
    height: PLOT_HEIGHT,
    marginRight: PLOT_MARGIN_RIGHT,
    y: {
      percent: true,
    },
    color: {
      // The "white" fill is so that non-selected dots have a white fill
      domain: ["Probation", "Rider", "Term", "white"],
      range: ["#25636F", "#D9A95F", "#BA4F4F", "#FFFFFF"],
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
