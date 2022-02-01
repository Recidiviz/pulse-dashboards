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
// ===================== ========================================================
import "./VizLengthOfStay.scss";

import { curveCatmullRom } from "d3-shape";
import { observer } from "mobx-react-lite";
import React from "react";
import { ResponsiveXYFrame } from "semiotic";

import { formatDate, formatPercent, getTicks } from "../../utils";
import SupervisionPopulationSnapshotMetric from "../models/SupervisionPopulationSnapshotMetric";
import PathwaysTooltip from "../PathwaysTooltip/PathwaysTooltip";
import withMetricHydrator from "../withMetricHydrator";

type VizLengthOfStayProps = {
  metric: SupervisionPopulationSnapshotMetric;
};

const VizLengthOfStay: React.FC<VizLengthOfStayProps> = ({ metric }) => {
  const {
    dataSeries,
    chartTitle,
    chartXAxisTitle,
    chartYAxisTitle,
    totalCount,
  } = metric;

  const latestUpdate = formatDate(dataSeries[0]?.lastUpdated, "MMMM dd, yyyy");

  let accumulatedCount = 0;
  const data = dataSeries.map((d: any) => {
    accumulatedCount += d.count;
    return {
      lengthOfStay: d.lengthOfStay,
      count: accumulatedCount,
      cohortProportion: (accumulatedCount * 100) / totalCount,
    };
  });

  const { maxTickValue } = getTicks(
    Math.max(...data.map((d) => d.cohortProportion))
  );

  const yRange = [0, maxTickValue];

  return (
    <div>
      <div className="VizPathways VizLengthOfStay">
        <div className="VizPathways__header">
          <div className="VizPathways__title">
            {chartTitle} <span>as of {latestUpdate}</span>
          </div>
        </div>
        <div className="VizLengthOfStay__chart-container">
          {chartYAxisTitle && (
            <div className="VizLengthOfStay__chartYAxisTitle">
              {chartYAxisTitle}
            </div>
          )}
          <ResponsiveXYFrame
            responsiveWidth
            hoverAnnotation
            tooltipContent={(d: any) => (
              <PathwaysTooltip
                label={`${d.lengthOfStay} months`}
                value={`${formatPercent(d.cohortProportion)}`}
              />
            )}
            // @ts-ignore
            lines={[{ data }]}
            lineDataAccessor="data"
            lineClass="VizPathways__historicalLine"
            xAccessor="lengthOfStay"
            yAccessor="cohortProportion"
            size={[558, 558]}
            margin={{ left: 75, bottom: 75, right: 50, top: 56 }}
            xExtent={[0, 60]}
            yExtent={yRange}
            pointClass="VizPathways__point"
            lineType={{ type: "line", interpolator: curveCatmullRom }}
            axes={[
              {
                orient: "left",
                tickFormat: (n: number) => `${n}%`,
                ticks: 5,
              },
              {
                orient: "bottom",
                tickValues: data.map((d) => d.lengthOfStay),
              },
            ]}
          />
        </div>
        {chartXAxisTitle && (
          <div className="VizLengthOfStay__chartXAxisTitle">
            {chartXAxisTitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default withMetricHydrator(observer(VizLengthOfStay));
