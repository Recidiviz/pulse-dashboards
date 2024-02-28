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
import { useCoreStore } from "../CoreStoreProvider";
import SnapshotMetric from "../models/SnapshotMetric";
import SupervisionPopulationSnapshotMetric from "../models/SupervisionPopulationSnapshotMetric";
import { SnapshotDataRecord } from "../models/types";
import { filterUnknownLengthOfStay } from "../models/utils";
import withPathwaysMetricHelpers from "../PathwaysMetricHelpers/withPathwaysMetricHelpers";
import PathwaysTooltip from "../PathwaysTooltip/PathwaysTooltip";
import VizPathways from "../VizPathways";

type VizLengthOfStayProps = {
  metric: SupervisionPopulationSnapshotMetric | SnapshotMetric;
};

const VizLengthOfStay: React.FC<VizLengthOfStayProps> = ({ metric }) => {
  const { filtersStore } = useCoreStore();
  const { filtersDescription } = filtersStore;
  const { dataSeries, chartTitle, chartXAxisTitle, chartYAxisTitle } = metric;

  const snapshotSeries = dataSeries as SnapshotDataRecord[];

  // TODO #1838
  // Remove this filter once consolidated backend is in place
  // and we no longer receive unknown LOS values
  const filteredRecords = snapshotSeries
    .filter((record: SnapshotDataRecord) => {
      return filterUnknownLengthOfStay(record.lengthOfStay);
    })
    .sort((a, b) => {
      // At this point lengthOfStay isn't null because we just filtered it out, so these if
      // statements are just to make TypeScript happy.
      if (!a.lengthOfStay) return 1;
      if (!b.lengthOfStay) return -1;
      return parseInt(a.lengthOfStay) - parseInt(b.lengthOfStay);
    });

  const latestUpdate = formatDate(
    metric instanceof SnapshotMetric
      ? metric.lastUpdated
      : filteredRecords[0]?.lastUpdated,
    "MMMM dd, yyyy",
  );

  const totalCount = filteredRecords.reduce((accumulator, d) => {
    return accumulator + d.count;
  }, 0);
  let accumulatedCount = 0;
  const data = filteredRecords.map((d: any) => {
    accumulatedCount += d.count;
    return {
      lengthOfStay: d.lengthOfStay,
      count: accumulatedCount,
      cohortProportion: (accumulatedCount * 100) / totalCount,
    };
  });
  data.unshift({ lengthOfStay: 0, count: 0, cohortProportion: 0 });

  const { maxTickValue } = getTicks(
    Math.max(...data.map((d) => d.cohortProportion)),
  );

  const yRange = [0, maxTickValue];

  return (
    <VizPathways
      className="VizLengthOfStay"
      title={chartTitle}
      latestUpdate={latestUpdate}
      subtitle={filtersDescription}
    >
      <div className="VizLengthOfStay__chart-container">
        {chartYAxisTitle && (
          <div className="VizLengthOfStay__chartYAxisTitle">
            {chartYAxisTitle}
          </div>
        )}
        <ResponsiveXYFrame
          responsiveWidth
          hoverAnnotation
          // eslint-disable-next-line react/no-unstable-nested-components
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
    </VizPathways>
  );
};

export default withPathwaysMetricHelpers(observer(VizLengthOfStay));
