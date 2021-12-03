// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import { observer } from "mobx-react-lite";
import React from "react";

import * as styles from "../CoreConstants.scss";
import { useCoreStore } from "../CoreStoreProvider";
import PopulationProjectionOverTimeMetric from "../models/PopulationProjectionOverTimeMetric";
import { PopulationProjectionTimeSeriesRecord } from "../models/types";
import withMetricHydrator from "../withMetricHydrator";
import {
  getChartTop,
  getDateRange,
  getDateSpacing,
  MonthOptions,
  prepareData,
} from "./helpers";
import PopulationTimeSeriesBaseChart from "./PopulationTimeSeriesBaseChart";
import PopulationTimeSeriesErrorBar from "./PopulationTimeSeriesErrorBar";

const TOTAL_INCARCERATED_LIMIT = 8008;

type Props = {
  metric: PopulationProjectionOverTimeMetric;
  title: string;
  data: PopulationProjectionTimeSeriesRecord[];
};

const PopulationProjectionTimeSeriesChart: React.FC<Props> = ({
  title,
  data,
  metric,
}) => {
  const { filtersStore } = useCoreStore();
  const { gender, legalStatus } = filtersStore.filters;
  if (data.length < 1) {
    return null;
  }

  const timePeriod: MonthOptions = parseInt(
    filtersStore.filters.timePeriod
  ) as MonthOptions;

  const dateSpacing = getDateSpacing(timePeriod);

  const { compartment } = data[0];

  const {
    historicalPopulation,
    projectedPopulation,
    uncertainty,
  } = prepareData(metric, data);

  const { beginDate, endDate } = getDateRange(
    historicalPopulation[0].date,
    projectedPopulation.slice(-1)[0].date,
    timePeriod
  );

  // update uncertainty range so areas align
  uncertainty[uncertainty.length / 2].date = endDate;
  uncertainty[uncertainty.length / 2 - 1].date = endDate;

  // set top of chart to the nearest thousand above the highest uncertainty value
  const chartTop = getChartTop(projectedPopulation);

  const projectionArea = [
    {
      data: [
        { date: projectedPopulation[0].date, value: 0 },
        { date: projectedPopulation[0].date, value: chartTop },
        { date: endDate, value: chartTop },
        { date: endDate, value: 0 },
      ],
    },
  ];

  const annotations = [
    {
      type: "area",
      className: "uncertainty",
      coordinates: uncertainty,
    },
    {
      type: "x",
      className: "projection-area-label",
      date: projectedPopulation.slice(-1)[0].date,
      note: {
        label: "Projected",
        align: "middle",
        lineType: null,
      },
      color: null,
      connector: { end: "none" },
      dx: -49,
      dy: 370,
    },
    {
      type: "y",
      value:
        gender === "ALL" &&
        legalStatus === ["ALL"] &&
        compartment === "INCARCERATION"
          ? TOTAL_INCARCERATED_LIMIT
          : 1e6,
      // Need to send this line off of the chart when not looking at all
      // incarcerated people. We need to move it instead of deleting it
      // to prevent semiotic from deleting and rerendering the annotation
      // layer which makes the uncertainty band just appear at its new location
      // instead of transforming its way there
      disable: "connector",
      color: styles.crimsonDark50,
      note: {
        label: `Total Operational Capacity (includes CAPP): ${TOTAL_INCARCERATED_LIMIT.toLocaleString()}`,
        align: "left",
        lineType: null,
        color: styles.crimsonDark,
        wrap: 500,
      },
      dx: -40,
      dy: 8,
    },
  ];

  return (
    <PopulationTimeSeriesBaseChart
      title={title}
      historicalPopulation={historicalPopulation}
      projectedPopulation={projectedPopulation}
      chartTop={chartTop}
      dateSpacing={dateSpacing}
      beginDate={beginDate}
      endDate={endDate}
      // additional components
      summaries={projectionArea}
      annotations={annotations}
      svgAnnotationRules={(d: any) => {
        // don't display hover annotations on corners of projection box
        if (d.d.parentSummary !== undefined) {
          return false;
        }

        if (d.d.parentLine?.class.endsWith("ProjectedLine")) {
          const [screenX, screenY] = d.screenCoordinates;
          const { value, lowerBound, upperBound } = d.d;
          const props = {
            value,
            lowerBound,
            upperBound,
            screenX,
            screenY,
            chartTop,
          };
          return <PopulationTimeSeriesErrorBar key={value} {...props} />;
        }

        return null;
      }}
    />
  );
};

export default withMetricHydrator(
  observer(PopulationProjectionTimeSeriesChart)
);
