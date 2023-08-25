/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

import "./VizAvgDailyPopulation.scss";

import { observer } from "mobx-react-lite";
import React from "react";
import { ResponsiveXYFrame } from "semiotic";

import styles from "../CoreConstants.module.scss";
import ImpactToolTip from "../ImpactToolTip/ImpactTooltip";
import UsTnCompliantReportingWorkflowsImpactMetric from "../models/UsTnCompliantReportingWorkflowsImpactMetric";
import VizPathways from "../VizPathways";

export interface VizAvgDailyPopulationProps {
  metric: UsTnCompliantReportingWorkflowsImpactMetric;
}

const VizAvgDailyPopulation: React.FC<VizAvgDailyPopulationProps> = ({
  metric,
}) => {
  const { useAvgDailyPopulationData } = metric;

  const chartTitle = "Average Daily Population";

  interface DataItem {
    months: number;
    value: number;
  }

  const data = useAvgDailyPopulationData;

  const avgDailyPopulationLine = {
    class: "VizPathways__avgDailyPopulationLine",
    data,
  };

  const chartXAxisTitle = "Months from Workflows launch date";

  const maxObject: DataItem = data.find(
    (obj) => obj.value === Math.max(...data.map((item) => item.value))
  ) ?? { months: 0, value: 0 };

  const maxValue = Math.round(maxObject.value / 2000) * 2000;

  const minObject: DataItem = data.find(
    (obj) => obj.value === Math.min(...data.map((item) => item.value))
  ) ?? { months: 0, value: 0 };

  const minValue = Math.round(minObject.value / 2000) * 2000;

  return (
    <VizPathways className="VizAvgDailyPopulation" title={chartTitle}>
      <ResponsiveXYFrame
        size={[558, 558]}
        margin={{
          left: 60,
          bottom: 96,
          right: 50,
          top: 56,
        }}
        responsiveWidth
        // @ts-ignore
        lineClass={(l) => l.class}
        // @ts-ignore
        lines={[avgDailyPopulationLine]}
        lineDataAccessor="data"
        summaryDataAccessor="data"
        xAccessor="months"
        yAccessor="value"
        pointClass="VizPathways__point"
        lineStyle={{ stroke: styles.indigo, strokeWidth: 2 }}
        axes={[
          { orient: "left", tickFormat: (n: number) => n.toLocaleString() },
          {
            orient: "bottom",
            // @ts-ignore
            tickFormat: (d: number) => d.toLocaleString(),
          },
        ]}
        yExtent={[minValue, maxValue]}
        showLinePoints
        hoverAnnotation
        annotations={[{ type: "x", x: 0, disable: ["connector"] }]}
        // eslint-disable-next-line react/no-unstable-nested-components
        tooltipContent={(d: any) => <ImpactToolTip d={d} />}
      />
      <div className="VizAvgDailyPopulation__chartXAxisTitle">
        {chartXAxisTitle}
      </div>
    </VizPathways>
  );
};

export default observer(VizAvgDailyPopulation);
